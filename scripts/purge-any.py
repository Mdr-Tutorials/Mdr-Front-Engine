"""Remove unnecessary `: any` annotations from callback parameters.

Replacements (only inside callback parameter lists, never inside identifiers
or comments):
- (current: any) -> (current)
- (currentEvent: any) -> (currentEvent)
- (node: any) -> (node)
- (option: any) -> (option)
- (transform: any) -> (transform)
- (child: any) -> (child)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

PARAM_NAMES = (
    "current",
    "currentEvent",
    "node",
    "option",
    "transform",
    "child",
)
PATTERNS = [
    (re.compile(rf"\b{name}: any\b"), name) for name in PARAM_NAMES
]


def main(files: list[str]) -> int:
    total = 0
    for raw_path in files:
        path = Path(raw_path)
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        for pattern, name in PATTERNS:
            text = pattern.sub(name, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            count = sum(
                1
                for pattern, _ in PATTERNS
                for _ in pattern.finditer(original)
            )
            total += count
            print(f"updated: {path}")
    print(f"total replacements: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
