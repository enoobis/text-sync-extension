from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / "icons"
SIZES = (16, 32, 48, 128)


def px(size, value):
    return max(1, round(value * size / 128))


def create_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    white = (255, 255, 255, 255)
    muted = (120, 120, 120, 255)

    pad = px(size, 24)
    bar_h = px(size, 5)
    bar_w = px(size, 26)
    gap = px(size, 10)
    mid_y = size // 2

    left_x = pad
    right_x = size - pad - bar_w
    arrow_x = size // 2

    for x, color in ((left_x, muted), (right_x, white)):
        draw.rounded_rectangle(
            [x, mid_y - px(size, 14), x + bar_w, mid_y - px(size, 14) + bar_h],
            radius=px(size, 1),
            fill=color,
        )
        draw.rounded_rectangle(
            [x, mid_y + px(size, 4), x + int(bar_w * 0.65), mid_y + px(size, 4) + bar_h],
            radius=px(size, 1),
            fill=color,
        )

    shaft = px(size, 14)
    head = px(size, 5)
    width = max(1, px(size, 2))
    y = mid_y - px(size, 1)

    draw.line(
        [(arrow_x - shaft, y), (arrow_x + shaft - head, y)],
        fill=white,
        width=width,
    )
    draw.polygon(
        [
            (arrow_x + shaft, y),
            (arrow_x + shaft - head * 2, y - head),
            (arrow_x + shaft - head * 2, y + head),
        ],
        fill=white,
    )

    return img


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = ROOT / f"icon{size}.png"
        create_icon(size).save(path, optimize=True)
        print(path.name)


if __name__ == "__main__":
    main()
