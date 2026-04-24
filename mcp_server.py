#!/usr/bin/env python3

from __future__ import annotations

import asyncio

from diary_mcp import get_mcp_server


async def main() -> None:
    await get_mcp_server().run_stdio_async()


if __name__ == "__main__":
    asyncio.run(main())
