import httpx

CHECK_TIMEOUT = 10.0


async def check_monitor_url(url: str) -> tuple[bool, str | None]:
    try:
        async with httpx.AsyncClient(
            timeout=CHECK_TIMEOUT,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            if 200 <= response.status_code < 400:
                return True, None
            return False, f"HTTP {response.status_code}"
    except httpx.RequestError as exc:
        return False, str(exc)
