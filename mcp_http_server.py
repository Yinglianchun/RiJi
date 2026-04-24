#!/usr/bin/env python3

from __future__ import annotations

import os
import secrets
from contextlib import asynccontextmanager
from typing import Any

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

from diary_mcp import DIARY_API_URL, get_mcp_server

MCP_HTTP_PORT = int(os.getenv("MCP_HTTP_PORT", "8080"))
MCP_BEARER_TOKEN = os.getenv("MCP_BEARER_TOKEN") or os.getenv("MCP_API_KEY")

PUBLIC_PATHS = {"/", "/health", "/mcp/health", "/mcp/info"}


class BearerTokenMiddleware:
    def __init__(self, app: Any, token: str | None) -> None:
        self.app = app
        self.token = token

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http" or self.token is None:
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

        token_ok = (
            (bearer_token and secrets.compare_digest(bearer_token, self.token))
            or (api_key_header and secrets.compare_digest(api_key_header, self.token))
        )

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
            "auth": "bearer" if MCP_BEARER_TOKEN else "none",
        }
    )


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "Haven的远程MCP"})


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
        *streamable_app.routes,
        *sse_app.routes,
    ]

    return Starlette(routes=routes, middleware=[], lifespan=lifespan)


app = BearerTokenMiddleware(build_app(), MCP_BEARER_TOKEN)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=MCP_HTTP_PORT)
