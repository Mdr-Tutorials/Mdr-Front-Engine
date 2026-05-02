"""Remove specific it()/test() blocks from a test file by their title.

Reads tasks from stdin, one per line, formatted: "<file_path>\t<test title>".
For each task, locates `it('<title>'` (or `test('<title>'` / double-quoted variant),
finds the matching closing `})` of that block, and deletes the whole block
plus a single trailing newline.
"""

from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path


def find_block_end(source: str, start: int) -> int:
    """Given the index of the first char of `it(` / `test(`, return the index
    one past the closing `)` (after the matching `})`).
    """
    depth = 0
    i = start
    n = len(source)
    in_str: str | None = None
    in_comment_block = False
    in_comment_line = False
    while i < n:
        ch = source[i]
        prev = source[i - 1] if i > 0 else ""
        if in_comment_line:
            if ch == "\n":
                in_comment_line = False
            i += 1
            continue
        if in_comment_block:
            if ch == "/" and prev == "*":
                in_comment_block = False
            i += 1
            continue
        if in_str is not None:
            if ch == "\\":
                i += 2
                continue
            if ch == in_str:
                in_str = None
            elif in_str == "`" and ch == "$" and i + 1 < n and source[i + 1] == "{":
                # template-literal substitution — count braces
                depth += 1
                i += 2
                continue
            i += 1
            continue
        if ch == "/" and i + 1 < n and source[i + 1] == "/":
            in_comment_line = True
            i += 2
            continue
        if ch == "/" and i + 1 < n and source[i + 1] == "*":
            in_comment_block = True
            i += 2
            continue
        if ch in ("'", '"', "`"):
            in_str = ch
            i += 1
            continue
        if ch == "(" or ch == "{":
            depth += 1
        elif ch == ")" or ch == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise ValueError("unbalanced block starting at offset %d" % start)


def strip_one(source: str, title: str) -> str | None:
    # Match it.skip / it.only / test.skip / test.only too.
    title_escaped = re.escape(title)
    pattern = re.compile(
        rf"(?:it|test)(?:\.(?:skip|only))?\(\s*(['\"`]){title_escaped}\1",
        re.MULTILINE,
    )
    match = pattern.search(source)
    if not match:
        return None
    block_start = match.start()
    end = find_block_end(source, block_start)
    # Eat one trailing newline (or "\r\n") and any preceding indentation so we
    # don't leave blank lines.
    line_start = source.rfind("\n", 0, block_start) + 1
    if source[line_start:block_start].strip() == "":
        block_start = line_start
    if end < len(source) and source[end] == ";":
        end += 1
    if end < len(source) and source[end] == "\r":
        end += 1
    if end < len(source) and source[end] == "\n":
        end += 1
    return source[:block_start] + source[end:]


def main() -> int:
    tasks: dict[Path, list[str]] = defaultdict(list)
    for raw in sys.stdin:
        line = raw.rstrip("\r\n")
        if not line.strip():
            continue
        if "\t" not in line:
            print(f"skip: missing tab: {line!r}", file=sys.stderr)
            continue
        path_str, title = line.split("\t", 1)
        tasks[Path(path_str)].append(title)

    rc = 0
    for path, titles in tasks.items():
        if not path.is_file():
            print(f"missing: {path}", file=sys.stderr)
            rc = 1
            continue
        text = path.read_text(encoding="utf-8")
        for title in titles:
            stripped = strip_one(text, title)
            if stripped is None:
                print(f"not-found: {path}: {title}", file=sys.stderr)
                rc = 1
                continue
            text = stripped
        path.write_text(text, encoding="utf-8")
        print(f"updated: {path} ({len(titles)} block(s))")
    return rc


if __name__ == "__main__":
    sys.exit(main())
