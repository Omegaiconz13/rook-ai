#!/usr/bin/env python3
"""Fetch free delayed market data with yfinance and write the desk's dataset.

    python3 -m venv .venv-data
    .venv-data/bin/pip install -r scripts/requirements.txt
    .venv-data/bin/python scripts/fetch_bars.py

Yahoo Finance serves 5-minute bars for roughly the last 60 days, so this writes
the most recent ~30 sessions (the current one may be partial), plus 30 daily
closes. Prices become integer cents; the timestamp of every session's open is
stored once, and each bar carries its index from that open, so a missing bar is
visible instead of silently shifting the rest of the session.

The output is a build artefact with provenance, not live data: the app labels it
with the fetch time and never claims to be a real-time feed. Re-run this script
to refresh it. Nothing here runs in the browser or the Worker.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

SYMBOLS = ["TSLA", "NVDA", "AMD", "AAPL", "MSFT", "META", "SPY", "QQQ"]
INTERVAL = "5m"
DEFAULT_SESSIONS = 30
DEFAULT_DAILY = 30
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "shared" / "data" / "market.json"
META_OUT = ROOT / "src" / "shared" / "data" / "meta.json"


def cents(value: float) -> int:
    return int(round(float(value) * 100))


def to_iso(ts) -> str:
    utc = ts.tz_convert("UTC") if hasattr(ts, "tz_convert") else ts.astimezone(timezone.utc)
    return utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def session_start_utc(day) -> datetime:
    """09:30 New York on that date, in UTC (the index is timezone-aware)."""
    open_ts = day.replace(hour=9, minute=30, second=0, microsecond=0)
    return open_ts.tz_convert("UTC").to_pydatetime()


def fetch(symbol: str, sessions: int, daily_count: int) -> dict:
    import yfinance as yf

    ticker = yf.Ticker(symbol)
    # Yahoo serves 5-minute bars for the last 60 days only; 50 leaves headroom
    # for the boundary being counted inclusively.
    intraday = ticker.history(period="50d", interval=INTERVAL, prepost=False, auto_adjust=False)
    if intraday.empty:
        raise SystemExit(f"{symbol}: yfinance returned no {INTERVAL} bars")

    out_sessions = []
    for day, frame in intraday.groupby(intraday.index.date):
        frame = frame.dropna(subset=["Open", "High", "Low", "Close"])
        if frame.empty:
            continue
        open_ts = session_start_utc(frame.index[0])
        start = frame.index[0].replace(hour=9, minute=30, second=0, microsecond=0)
        bars = []
        for ts, row in frame.iterrows():
            idx = int(round((ts - start).total_seconds() / 60 / 5))
            if idx < 0:
                continue
            # Yahoo can leave a flat placeholder for the bar still forming; it has no
            # traded volume and would read as a real candle on the chart.
            if int(row["Volume"]) <= 0:
                continue
            bars.append(
                [
                    idx,
                    cents(row["Open"]),
                    cents(row["High"]),
                    cents(row["Low"]),
                    cents(row["Close"]),
                    int(row["Volume"]),
                ]
            )
        if bars:
            out_sessions.append(
                {"date": day.isoformat(), "open": to_iso(open_ts), "bars": bars}
            )

    out_sessions = out_sessions[-sessions:]

    history = ticker.history(period="6mo", interval="1d", auto_adjust=False)
    daily = [
        [ts.date().isoformat(), cents(row["Close"])]
        for ts, row in history.dropna(subset=["Close"]).iterrows()
    ][-daily_count:]

    return {"sessions": out_sessions, "daily": daily}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--symbols", default=",".join(SYMBOLS))
    parser.add_argument("--sessions", type=int, default=DEFAULT_SESSIONS)
    parser.add_argument("--daily", type=int, default=DEFAULT_DAILY)
    parser.add_argument("--out", default=str(OUT))
    args = parser.parse_args()

    symbols = [s.strip().upper() for s in args.symbols.split(",") if s.strip()]
    data = {symbol: fetch(symbol, args.sessions, args.daily) for symbol in symbols}

    dates = [s["sessions"][-1]["date"] for s in data.values() if s["sessions"]]
    session_date = max(dates) if dates else None
    partial = any(
        s["sessions"] and s["sessions"][-1]["date"] == session_date and len(s["sessions"][-1]["bars"]) < 78
        for s in data.values()
    )

    payload = {
        "version": 1,
        "meta": {
            "source": "yfinance",
            "provider": "Yahoo Finance",
            "interval": INTERVAL,
            "timezone": "America/New_York",
            "sessionDate": session_date,
            "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "delayed": True,
            "partialSession": partial,
            "sessions": args.sessions,
            "note": "Delayed Yahoo Finance bars fetched with the yfinance package at build time.",
        },
        "symbols": data,
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    # Split the metadata out so screens that only need the session date and the
    # provenance line do not pull the bars into their bundle.
    META_OUT.write_text(json.dumps(payload["meta"], indent=2) + "\n", encoding="utf-8")

    size = out.stat().st_size
    counts = {s: len(d["sessions"]) for s, d in data.items()}
    last = data[symbols[0]]["sessions"][-1]
    print(f"wrote {out.relative_to(ROOT)} · {size / 1024:.0f} KB · session {session_date}")
    print(f"sessions per symbol: {counts}")
    print(f"last session bars: {len(last['bars'])} · first bar {last['bars'][0]} · last {last['bars'][-1]}")


if __name__ == "__main__":
    main()
