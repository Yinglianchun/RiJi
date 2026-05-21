#!/usr/bin/env python3

from __future__ import annotations

import os
import secrets
import time
import urllib.parse
from base64 import b64decode
from contextlib import asynccontextmanager
from typing import Any

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, RedirectResponse
from starlette.routing import Route

from diary_mcp import DIARY_API_URL, get_mcp_server

MCP_HTTP_PORT = int(os.getenv("MCP_HTTP_PORT", "8080"))
MCP_BEARER_TOKEN = os.getenv("MCP_BEARER_TOKEN") or os.getenv("MCP_API_KEY")
CHATGPT_OAUTH_CLIENT_ID = os.getenv("CHATGPT_OAUTH_CLIENT_ID", "")
CHATGPT_OAUTH_CLIENT_SECRET = os.getenv("CHATGPT_OAUTH_CLIENT_SECRET", "")
CHATGPT_OAUTH_ACCESS_TOKEN = os.getenv("CHATGPT_OAUTH_ACCESS_TOKEN", "")
CHATGPT_OAUTH_REFRESH_TOKEN = os.getenv("CHATGPT_OAUTH_REFRESH_TOKEN", "")
CHATGPT_OAUTH_PUBLIC_BASE_URL = os.getenv("CHATGPT_OAUTH_PUBLIC_BASE_URL", "").rstrip("/")
CHATGPT_OAUTH_REDIRECT_PREFIX = os.getenv(
    "CHATGPT_OAUTH_REDIRECT_PREFIX",
    "https://chatgpt.com/connector/oauth/",
)
CHATGPT_OAUTH_TOKEN_TTL_SECONDS = int(os.getenv("CHATGPT_OAUTH_TOKEN_TTL_SECONDS", "2592000"))

PUBLIC_PATHS = {
    "/",
    "/health",
    "/mcp/health",
    "/mcp/info",
    "/mcp/oauth/authorize",
    "/mcp/oauth/token",
    "/mcp/.well-known/oauth-authorization-server",
    "/mcp/.well-known/oauth-protected-resource",
    "/mcp/.well-known/openid-configuration",
}


class ChatGptOAuthProvider:
    def __init__(
        self,
        client_id: str,
        client_secret: str = "",
        access_token: str = "",
        refresh_token: str = "",
        redirect_prefix: str = "",
        token_ttl_seconds: int = 2592000,
    ) -> None:
        self.client_id = client_id.strip()
        self.client_secret = client_secret.strip()
        self.access_token = access_token.strip() or secrets.token_urlsafe(48)
        self.refresh_token = refresh_token.strip() or secrets.token_urlsafe(48)
        self.redirect_prefix = redirect_prefix.strip()
        self.token_ttl_seconds = max(300, token_ttl_seconds)
        self._codes: dict[str, dict[str, Any]] = {}

    @property
    def enabled(self) -> bool:
        return bool(self.client_id)

    def issue_code(self, redirect_uri: str, scope: str = "") -> str:
        self._purge_codes()
        code = secrets.token_urlsafe(32)
        self._codes[code] = {
            "redirect_uri": redirect_uri,
            "scope": scope,
            "expires_at": time.time() + 300,
        }
        return code

    def consume_code(self, code: str, redirect_uri: str) -> bool:
        self._purge_codes()
        data = self._codes.pop(code, None)
        if not data:
            return False
        if data["redirect_uri"] != redirect_uri:
            return False
        return data["expires_at"] >= time.time()

    def valid_access_token(self, token: str) -> bool:
        return self.enabled and bool(token) and secrets.compare_digest(token, self.access_token)

    def valid_client_id(self, client_id: str) -> bool:
        return self.enabled and secrets.compare_digest(client_id, self.client_id)

    def valid_client(self, client_id: str, client_secret: str = "") -> bool:
        if not self.valid_client_id(client_id):
            return False
        if self.client_secret:
            return bool(client_secret) and secrets.compare_digest(client_secret, self.client_secret)
        return True

    def redirect_uri_allowed(self, redirect_uri: str) -> bool:
        if not self.redirect_prefix:
            return True
        return redirect_uri.startswith(self.redirect_prefix)

    def token_payload(self) -> dict[str, Any]:
        return {
            "access_token": self.access_token,
            "token_type": "Bearer",
            "expires_in": self.token_ttl_seconds,
            "refresh_token": self.refresh_token,
        }

    def _purge_codes(self) -> None:
        now = time.time()
        expired = [code for code, data in self._codes.items() if data["expires_at"] < now]
        for code in expired:
            self._codes.pop(code, None)


CHATGPT_OAUTH = ChatGptOAuthProvider(
    client_id=CHATGPT_OAUTH_CLIENT_ID,
    client_secret=CHATGPT_OAUTH_CLIENT_SECRET,
    access_token=CHATGPT_OAUTH_ACCESS_TOKEN,
    refresh_token=CHATGPT_OAUTH_REFRESH_TOKEN,
    redirect_prefix=CHATGPT_OAUTH_REDIRECT_PREFIX,
    token_ttl_seconds=CHATGPT_OAUTH_TOKEN_TTL_SECONDS,
)


class BearerTokenMiddleware:
    def __init__(
        self,
        app: Any,
        token: str | None,
        oauth_provider: ChatGptOAuthProvider | None = None,
    ) -> None:
        self.app = app
        self.token = token
        self.oauth_provider = oauth_provider

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        oauth_enabled = bool(self.oauth_provider and self.oauth_provider.enabled)
        if scope["type"] != "http" or (self.token is None and not oauth_enabled):
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if not path.startswith("/mcp") or path in PUBLIC_PATHS:
            await self.app(scope, receive, send)
            return

        headers = {key.decode().lower(): value.decode() for key, value in scope["headers"]}
        auth_header = headers.get("authorization", "")
        api_key_header = headers.get("x-api-key", "")

        bearer_token = ""
        scheme, _, value = auth_header.partition(" ")
        if scheme.lower() == "bearer":
            bearer_token = value.strip()

        token_ok = False
        if self.token:
            token_ok = (
                (bearer_token and secrets.compare_digest(bearer_token, self.token))
                or (api_key_header and secrets.compare_digest(api_key_header, self.token))
            )
        if not token_ok and self.oauth_provider:
            token_ok = self.oauth_provider.valid_access_token(bearer_token)

        if token_ok:
            await self.app(scope, receive, send)
            return

        response = JSONResponse(
            {"detail": "Missing or invalid bearer token."},
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
        )
        await response(scope, receive, send)


async def root(_: Request) -> JSONResponse:
    auth_mode = "oauth" if CHATGPT_OAUTH.enabled else ("bearer" if MCP_BEARER_TOKEN else "none")
    return JSONResponse(
        {
            "name": "Haven的远程MCP",
            "version": "2.0.0",
            "transport": {
                "httpStream": "/mcp",
                "sse": "/mcp/sse",
                "messages": "/mcp/messages/",
            },
            "diary_api_url": DIARY_API_URL,
            "auth": auth_mode,
            "oauth": {
                "authorization_url": "/mcp/oauth/authorize",
                "token_url": "/mcp/oauth/token",
            } if CHATGPT_OAUTH.enabled else None,
        }
    )


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "Haven的远程MCP"})


def _public_base_url(request: Request) -> str:
    if CHATGPT_OAUTH_PUBLIC_BASE_URL:
        return CHATGPT_OAUTH_PUBLIC_BASE_URL
    return str(request.base_url).rstrip("/")


async def oauth_authorize(request: Request) -> JSONResponse | RedirectResponse:
    if not CHATGPT_OAUTH.enabled:
        return JSONResponse({"error": "oauth_not_configured"}, status_code=404)

    params = request.query_params
    response_type = params.get("response_type", "")
    client_id = params.get("client_id", "")
    redirect_uri = params.get("redirect_uri", "")
    state = params.get("state", "")
    scope = params.get("scope", "")

    if response_type != "code":
        return JSONResponse({"error": "unsupported_response_type"}, status_code=400)
    if not CHATGPT_OAUTH.valid_client_id(client_id):
        return JSONResponse({"error": "invalid_client"}, status_code=401)
    if not redirect_uri or not CHATGPT_OAUTH.redirect_uri_allowed(redirect_uri):
        return JSONResponse({"error": "invalid_redirect_uri"}, status_code=400)

    code = CHATGPT_OAUTH.issue_code(redirect_uri, scope)
    query = {"code": code}
    if state:
        query["state"] = state
    separator = "&" if "?" in redirect_uri else "?"
    return RedirectResponse(redirect_uri + separator + urllib.parse.urlencode(query), status_code=302)


def _basic_client_credentials(auth_header: str) -> tuple[str, str]:
    scheme, _, encoded = auth_header.partition(" ")
    if scheme.lower() != "basic" or not encoded.strip():
        return "", ""
    try:
        decoded = b64decode(encoded.strip()).decode("utf-8")
    except Exception:
        return "", ""
    client_id, _, client_secret = decoded.partition(":")
    return client_id, client_secret


async def _form_data(request: Request) -> dict[str, str]:
    body = (await request.body()).decode("utf-8")
    parsed = urllib.parse.parse_qs(body, keep_blank_values=True)
    return {key: values[-1] if values else "" for key, values in parsed.items()}


def _client_auth_ok(request: Request, form: dict[str, str]) -> bool:
    basic_id, basic_secret = _basic_client_credentials(request.headers.get("authorization", ""))
    client_id = basic_id or form.get("client_id", "")
    client_secret = basic_secret or form.get("client_secret", "")
    return CHATGPT_OAUTH.valid_client(client_id, client_secret)


def _supported_token_auth_methods() -> list[str]:
    if CHATGPT_OAUTH.client_secret:
        return ["client_secret_post", "client_secret_basic"]
    return ["none"]


async def oauth_token(request: Request) -> JSONResponse:
    if not CHATGPT_OAUTH.enabled:
        return JSONResponse({"error": "oauth_not_configured"}, status_code=404)

    form = await _form_data(request)
    if not _client_auth_ok(request, form):
        return JSONResponse({"error": "invalid_client"}, status_code=401)

    grant_type = form.get("grant_type", "")
    if grant_type == "authorization_code":
        code = form.get("code", "")
        redirect_uri = form.get("redirect_uri", "")
        if not CHATGPT_OAUTH.consume_code(code, redirect_uri):
            return JSONResponse({"error": "invalid_grant"}, status_code=400)
        return JSONResponse(CHATGPT_OAUTH.token_payload())

    if grant_type == "refresh_token":
        refresh_token = form.get("refresh_token", "")
        if not secrets.compare_digest(refresh_token, CHATGPT_OAUTH.refresh_token):
            return JSONResponse({"error": "invalid_grant"}, status_code=400)
        return JSONResponse(CHATGPT_OAUTH.token_payload())

    return JSONResponse({"error": "unsupported_grant_type"}, status_code=400)


async def oauth_metadata(request: Request) -> JSONResponse:
    if not CHATGPT_OAUTH.enabled:
        return JSONResponse({"error": "oauth_not_configured"}, status_code=404)

    base = _public_base_url(request)
    return JSONResponse(
        {
            "issuer": base,
            "authorization_endpoint": f"{base}/mcp/oauth/authorize",
            "token_endpoint": f"{base}/mcp/oauth/token",
            "response_types_supported": ["code"],
            "grant_types_supported": ["authorization_code", "refresh_token"],
            "token_endpoint_auth_methods_supported": _supported_token_auth_methods(),
        }
    )


async def oauth_protected_resource_metadata(request: Request) -> JSONResponse:
    if not CHATGPT_OAUTH.enabled:
        return JSONResponse({"error": "oauth_not_configured"}, status_code=404)

    base = _public_base_url(request)
    return JSONResponse(
        {
            "resource": f"{base}/mcp",
            "authorization_servers": [
                f"{base}/mcp/.well-known/oauth-authorization-server"
            ],
            "bearer_methods_supported": ["header"],
        }
    )


def build_app() -> Starlette:
    mcp_server = get_mcp_server()
    streamable_app = mcp_server.streamable_http_app()
    sse_app = mcp_server.sse_app()

    @asynccontextmanager
    async def lifespan(_: Starlette):
        async with mcp_server.session_manager.run():
            yield

    routes = [
        Route("/", endpoint=root),
        Route("/health", endpoint=health),
        Route("/mcp/health", endpoint=health),
        Route("/mcp/info", endpoint=root),
        Route("/mcp/oauth/authorize", endpoint=oauth_authorize, methods=["GET"]),
        Route("/mcp/oauth/token", endpoint=oauth_token, methods=["POST"]),
        Route("/mcp/.well-known/oauth-authorization-server", endpoint=oauth_metadata, methods=["GET"]),
        Route("/mcp/.well-known/oauth-protected-resource", endpoint=oauth_protected_resource_metadata, methods=["GET"]),
        Route("/mcp/.well-known/openid-configuration", endpoint=oauth_metadata, methods=["GET"]),
        *streamable_app.routes,
        *sse_app.routes,
    ]

    return Starlette(routes=routes, middleware=[], lifespan=lifespan)


app = BearerTokenMiddleware(build_app(), MCP_BEARER_TOKEN, CHATGPT_OAUTH)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=MCP_HTTP_PORT)
