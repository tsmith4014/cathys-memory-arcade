import unittest
from datetime import timezone

from generate_signals import parse_feed


class SignalTests(unittest.TestCase):
    def test_parses_atom_feed(self) -> None:
        xml = """<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Useful note</title><link href="https://example.com/note"/><updated>2026-07-19T12:00:00Z</updated></entry></feed>"""
        signal = parse_feed("AI practice", "Example", xml)[0]
        self.assertEqual(signal.title, "Useful note")
        self.assertEqual(signal.url, "https://example.com/note")
        self.assertEqual(signal.timestamp.tzinfo, timezone.utc)

    def test_ignores_entries_without_dates(self) -> None:
        xml = """<rss><channel><item><title>Undated</title><link>https://example.com</link></item></channel></rss>"""
        self.assertEqual(parse_feed("Systems", "Example", xml), [])


if __name__ == "__main__":
    unittest.main()
