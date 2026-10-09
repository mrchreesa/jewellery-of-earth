"""Grade the client's Instagram photos so they sit together on the page.

The originals are 640px squares with heavy 2014 filters (lifted blacks,
warm casts). This stretches contrast, pulls saturation back slightly and
writes progressive JPEGs to shared/img/.

Usage: python3 tools/process_images.py
"""
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "source"
OUT = ROOT / "shared" / "img"


def grade(im: Image.Image) -> Image.Image:
    im = ImageOps.autocontrast(im.convert("RGB"), cutoff=1)
    im = ImageEnhance.Color(im).enhance(0.92)
    return im


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for path in sorted(SRC.glob("*.jpg")):
        out = OUT / path.name
        grade(Image.open(path)).save(out, "JPEG", quality=82, progressive=True, optimize=True)
        print(f"{path.name} -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
