from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import requests
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.server import TransportSecuritySettings

DIARY_API_URL = os.getenv("DIARY_API_URL", "http://localhost:8000").rstrip("/")
REQUEST_TIMEOUT = 20

def get_shanghai_timezone() -> ZoneInfo | timezone:
    try:
        return ZoneInfo("Asia/Shanghai")
    except ZoneInfoNotFoundError:
        return timezone(timedelta(hours=8))


SHANGHAI_TZ = get_shanghai_timezone()


def shanghai_today() -> str:
    return datetime.now(SHANGHAI_TZ).strftime("%Y-%m-%d")


def split_env_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            result.append(value)
            seen.add(value)
    return result


def build_transport_security() -> TransportSecuritySettings:
    allowed_hosts = unique(
        [
            "127.0.0.1",
            "127.0.0.1:*",
            "localhost",
            "localhost:*",
            "[::1]",
            "[::1]:*",
            *split_env_list(os.getenv("MCP_ALLOWED_HOSTS")),
        ]
    )
    allowed_origins = unique(
        [
            "http://127.0.0.1",
            "http://127.0.0.1:*",
            "http://localhost",
            "http://localhost:*",
            "http://[::1]",
            "http://[::1]:*",
            *split_env_list(os.getenv("MCP_ALLOWED_ORIGINS")),
        ]
    )
    return TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=allowed_hosts,
        allowed_origins=allowed_origins,
    )


def api_request(method: str, endpoint: str, **kwargs: Any) -> dict[str, Any]:
    url = f"{DIARY_API_URL}{endpoint}"

    try:
        response = requests.request(method, url, timeout=REQUEST_TIMEOUT, **kwargs)
        response.raise_for_status()
    except requests.HTTPError as exc:
        detail: Any
        try:
            detail = response.json()
        except ValueError:
            detail = response.text

        if isinstance(detail, dict) and "detail" in detail:
            message = str(detail["detail"])
        elif detail:
            message = str(detail)
        else:
            message = str(exc)

        raise RuntimeError(message) from exc
    except requests.RequestException as exc:
        raise RuntimeError(f"Diary API request failed: {exc}") from exc

    try:
        return response.json()
    except ValueError as exc:
        raise RuntimeError("Diary API returned a non-JSON response.") from exc


server = FastMCP(
    name="ai-diary",
    instructions=(
        "Use these tools to write, read, search and update diary entries in Haven. "
        "Dates use YYYY-MM-DD, and when a date is omitted the server defaults to "
        "the current Asia/Shanghai day."
    ),
    streamable_http_path="/mcp",
    sse_path="/mcp/sse",
    message_path="/mcp/messages/",
    transport_security=build_transport_security(),
)


@server.tool(
    description="写一篇新的日记。date 留空时会自动使用东八区今天的日期。"
)
def write_diary(
    content: str,
    title: str | None = None,
    emotion_tags: list[str] | None = None,
    date: str | None = None,
) -> dict[str, Any]:
    entry_date = date or shanghai_today()
    result = api_request(
        "POST",
        "/diaries",
        json={
            "date": entry_date,
            "title": title,
            "content": content,
            "author": "ai",
            "emotion_tags": emotion_tags,
        },
    )

    return {
        "id": result.get("id"),
        "date": entry_date,
        "title": title,
        "message": result.get("message", "日记创建成功"),
    }


@server.tool(description="按日期读取一篇日记，并返回评论和情绪标签。")
def read_diary(date: str) -> dict[str, Any]:
    return api_request("GET", f"/diaries/date/{date}")


@server.tool(description="按关键词、日期范围或情绪标签搜索日记。")
def search_diaries(
    keyword: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    emotion_tag: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    payload = {
        key: value
        for key, value in {
            "keyword": keyword,
            "start_date": start_date,
            "end_date": end_date,
            "emotion_tag": emotion_tag,
            "limit": limit,
        }.items()
        if value is not None
    }

    result = api_request("POST", "/diaries/search", json=payload)
    return {
        "count": result.get("count", 0),
        "diaries": result.get("diaries", []),
    }


@server.tool(description="以 Haven 的身份给指定日记添加一条评论。")
def add_comment(diary_id: int, content: str) -> dict[str, Any]:
    result = api_request(
        "POST",
        f"/diaries/{diary_id}/comments",
        json={"content": content, "author": "ai"},
    )
    return {
        "id": result.get("id"),
        "diary_id": diary_id,
        "message": result.get("message", "评论添加成功"),
    }


@server.tool(description="更新已有日记的正文、标题或情绪标签。")
def update_diary(
    diary_id: int,
    content: str | None = None,
    title: str | None = None,
    emotion_tags: list[str] | None = None,
) -> dict[str, Any]:
    payload = {
        key: value
        for key, value in {
            "content": content,
            "title": title,
            "emotion_tags": emotion_tags,
        }.items()
        if value is not None
    }

    if not payload:
        raise ValueError("At least one field must be provided to update_diary.")

    result = api_request("PUT", f"/diaries/{diary_id}", json=payload)
    return {
        "diary_id": diary_id,
        "message": result.get("message", "日记更新成功"),
    }


def get_mcp_server() -> FastMCP:
    return server
