#!/usr/bin/env python3
"""
Generate a 1024×1024 source PNG for the subtracker app icon.
The image is then processed by `tauri icon` to produce all required formats.

Usage:
    python3 scripts/app-icon.py          # writes src-tauri/icons/icon-source.png
    npx tauri icon src-tauri/icons/icon-source.png

Requires Pillow (pip install pillow).  Falls back to a stdlib-only minimal PNG
if Pillow is not installed (lower quality but sufficient for a placeholder).
"""
import struct
import zlib
from pathlib import Path

ICONS_DIR = Path(__file__).parent.parent / "src-tauri" / "icons"
SOURCE_FILE = ICONS_DIR / "icon-source.png"

# Brand colour: blue-500
BLUE = (59, 130, 246)
WHITE = (255, 255, 255)


# ── stdlib fallback ──────────────────────────────────────────────────────────

def _png_chunk(tag: bytes, data: bytes) -> bytes:
    body = tag + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def _make_png_stdlib(size: int) -> bytes:
    """Solid-colour PNG, no dependencies."""
    r, g, b = BLUE
    row = b"\x00" + bytes([r, g, b]) * size
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", zlib.compress(row * size))
        + _png_chunk(b"IEND", b"")
    )


# ── Pillow version ───────────────────────────────────────────────────────────

def _make_png_pillow(size: int) -> "Image":
    from PIL import Image, ImageDraw

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded-rectangle background
    pad = size // 8
    draw.rounded_rectangle(
        [pad, pad, size - pad - 1, size - pad - 1],
        radius=size // 5,
        fill=(*BLUE, 255),
    )

    # Dollar-sign glyph (simple lines)
    cx, cy = size // 2, size // 2
    lw = max(1, size // 20)
    s = size // 3  # glyph half-height

    # Vertical bar
    draw.line([(cx, cy - s), (cx, cy + s)], fill=(*WHITE, 255), width=lw)
    # Top arc (simplified as rectangle)
    aw = size // 6
    ah = size // 8
    draw.arc(
        [cx - aw, cy - s + lw, cx + aw, cy - s + ah * 2 + lw],
        start=0,
        end=180,
        fill=(*WHITE, 255),
        width=lw,
    )
    draw.arc(
        [cx - aw, cy - ah, cx + aw, cy + ah],
        start=180,
        end=0,
        fill=(*WHITE, 255),
        width=lw,
    )
    draw.arc(
        [cx - aw, cy - ah, cx + aw, cy + s - lw],
        start=0,
        end=180,
        fill=(*WHITE, 255),
        width=lw,
    )

    return img


# ── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        from PIL import Image  # noqa: F401

        img = _make_png_pillow(1024)
        img.save(SOURCE_FILE)
        print(f"✓ Icon source (Pillow) → {SOURCE_FILE}")
    except ImportError:
        SOURCE_FILE.write_bytes(_make_png_stdlib(1024))
        print(f"✓ Icon source (stdlib fallback) → {SOURCE_FILE}")
        print("  Install Pillow for a nicer icon: pip install pillow")


if __name__ == "__main__":
    main()
