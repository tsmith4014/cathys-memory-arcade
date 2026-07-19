from __future__ import annotations

import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path

OUTPUT = Path(__file__).parents[1] / "public" / "data" / "signals.json"
USER_AGENT = "cathys-memory-arcade/1.0 (+https://github.com/tsmith4014/cathys-memory-arcade)"
TIMEOUT = 15

TRACKS = (
    (
        "AI practice",
        (
            ("Simon Willison", "https://simonwillison.net/atom/everything/", "https://simonwillison.net/"),
            ("OpenAI Developers", "https://developers.openai.com/rss.xml", "https://developers.openai.com/"),
        ),
    ),
    (
        "Systems",
        (
            ("LWN.net", "https://lwn.net/headlines/rss", "https://lwn.net/"),
            ("Brendan Gregg", "https://www.brendangregg.com/blog/rss.xml", "https://www.brendangregg.com/blog/"),
        ),
    ),
    (
        "Architecture",
        (
            ("Martin Fowler", "https://martinfowler.com/feed.atom", "https://martinfowler.com/"),
            ("InfoQ", "https://feed.infoq.com", "https://www.infoq.com/"),
        ),
    ),
    (
        "Edge and cloud",
        (
            ("Cloudflare Blog", "https://blog.cloudflare.com/rss/", "https://blog.cloudflare.com/"),
            ("AWS What's New", "https://aws.amazon.com/about-aws/whats-new/recent/feed/", "https://aws.amazon.com/about-aws/whats-new/"),
        ),
    ),
)


@dataclass(frozen=True)
class Signal:
    track: str
    title: str
    url: str
    source: str
    published: str
    timestamp: datetime


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip()


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        return response.read().decode("utf-8", errors="replace")


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def child_value(element: ET.Element, name: str) -> str:
    for child in element:
        if local_name(child.tag) != name:
            continue
        if name == "link" and child.attrib.get("href"):
            return child.attrib["href"]
        if child.text:
            return clean(child.text)
    return ""


def parse_timestamp(value: str) -> datetime | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def entries(root: ET.Element) -> list[ET.Element]:
    if local_name(root.tag) == "feed":
        return [child for child in root if local_name(child.tag) == "entry"]
    for child in root:
        if local_name(child.tag) == "channel":
            return [item for item in child if local_name(item.tag) == "item"]
    return []


def parse_feed(track: str, source: str, xml: str) -> list[Signal]:
    parsed: list[Signal] = []
    for entry in entries(ET.fromstring(xml)):
        title = child_value(entry, "title")
        url = child_value(entry, "link")
        timestamp = (
            parse_timestamp(child_value(entry, "pubDate"))
            or parse_timestamp(child_value(entry, "published"))
            or parse_timestamp(child_value(entry, "updated"))
        )
        if title and url and timestamp:
            parsed.append(
                Signal(track, title[:140], url, source, timestamp.strftime("%b %-d"), timestamp)
            )
    return parsed


def select_track(track: str, sources: tuple[tuple[str, str, str], ...]) -> Signal:
    candidates: list[Signal] = []
    for source, feed_url, _ in sources:
        try:
            candidates.extend(parse_feed(track, source, fetch(feed_url)))
        except (ET.ParseError, OSError, ValueError):
            continue
    if candidates:
        return max(candidates, key=lambda signal: signal.timestamp)
    source, _, home_url = sources[0]
    return Signal(track, f"Visit {source}", home_url, source, "Source link", datetime.min.replace(tzinfo=timezone.utc))


def generate() -> dict[str, object]:
    selected = [select_track(track, sources) for track, sources in TRACKS]
    signals = []
    for signal in selected:
        data = asdict(signal)
        data.pop("timestamp")
        signals.append(data)
    return {"generatedAt": datetime.now(timezone.utc).isoformat(), "signals": signals}


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(generate(), indent=2) + "\n", encoding="utf-8")
