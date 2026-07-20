#!/usr/bin/env python3
"""Packs the 16x16 and 32x32 favicon PNGs into a single favicon.ico container
(PNG-in-ICO format — every modern browser reads this; there's no other way to
produce an .ico on macOS since sips doesn't support ICO output and no
ImageMagick/Pillow is installed in this environment). Standard library only.
Run from the assets/brand/ directory: python3 build-favicon-ico.py
"""
import struct
import sys
from pathlib import Path

SOURCES = [("favicon/favicon-16.png", 16), ("favicon/favicon-32.png", 32)]
OUT = Path("favicon/favicon.ico")


def build_ico(sources):
    images = []
    for path, size in sources:
        data = Path(path).read_bytes()
        images.append((size, data))

    count = len(images)
    header = struct.pack("<HHH", 0, 1, count)  # reserved, type=1 (icon), count

    dir_entries = b""
    image_data = b""
    offset = 6 + 16 * count  # ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes each)

    for size, data in images:
        w = 0 if size >= 256 else size
        h = 0 if size >= 256 else size
        dir_entries += struct.pack(
            "<BBBBHHII", w, h, 0, 0, 1, 32, len(data), offset
        )
        image_data += data
        offset += len(data)

    return header + dir_entries + image_data


if __name__ == "__main__":
    ico_bytes = build_ico(SOURCES)
    OUT.write_bytes(ico_bytes)
    print(f"Wrote {OUT} ({len(ico_bytes)} bytes) from {len(SOURCES)} source PNGs")
