"""
App Store Promotional Image Generator for Shelly Manager.

Outputs:
  promo/iphone/ — 1242 × 2688 portrait images (one per iPhone screenshot)
  promo/ipad/   — 2048 × 2732 portrait images (one per iPad screenshot)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SS_DIR = os.path.join(BASE_DIR, "screenshots")
OUT_IPHONE = os.path.join(BASE_DIR, "promo", "iphone")
OUT_IPAD = os.path.join(BASE_DIR, "promo", "ipad")
os.makedirs(OUT_IPHONE, exist_ok=True)
os.makedirs(OUT_IPAD, exist_ok=True)

# ── Fonts ─────────────────────────────────────────────────────────────────────
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG  = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BLK  = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

# ── Brand colours ─────────────────────────────────────────────────────────────
BG_TOP    = (14, 16, 22)       # near-black navy
BG_BOTTOM = (20, 34, 60)       # deep blue
ACCENT    = (34, 139, 230)     # Mantine blue-6 (#228BE6)
ACCENT2   = (16,  90, 180)     # darker blue for gradient
WHITE     = (255, 255, 255)
LIGHT     = (200, 210, 230)
MUTED     = (120, 135, 160)
FRAME_CLR = (40,  55,  85)     # device frame border

# ── Per-screenshot metadata ────────────────────────────────────────────────────
IPHONE_SHOTS = [
    {
        "file": "Simulator Screenshot - iPhone 17 Pro - 2026-04-20 at 20.20.37.png",
        "headline": "Instant Device\nDiscovery",
        "subtitle": "Auto-discover every Shelly device on your\nlocal network — no manual setup required.",
        "tag": "01_discover",
    },
    {
        "file": "Simulator Screenshot - iPhone 17 Pro - 2026-04-20 at 20.21.18.png",
        "headline": "Full Device\nControl",
        "subtitle": "Toggle switches, monitor live power draw,\nand explore energy stats in real time.",
        "tag": "02_device_detail",
    },
]

IPAD_SHOTS = [
    {
        "file": "Simulator Screenshot - iPad Pro 11-inch (M5) - 2026-04-20 at 20.23.35.png",
        "headline": "Your Smart Home\nDashboard",
        "subtitle": "All your Shelly devices in one clean, native interface\ndesigned for iPad's large display.",
        "tag": "01_dashboard",
    },
    {
        "file": "Simulator Screenshot - iPad Pro 11-inch (M5) - 2026-04-20 at 20.23.40.png",
        "headline": "Three Ways to\nDiscover Devices",
        "subtitle": "mDNS auto-discovery, subnet scan, or manual entry —\nchoose the method that fits your setup.",
        "tag": "02_discover",
    },
    {
        "file": "Simulator Screenshot - iPad Pro 11-inch (M5) - 2026-04-20 at 20.23.44.png",
        "headline": "Always Up\nto Date",
        "subtitle": "Check and push firmware updates to all your\nShelly Gen 2/3/4 devices from one place.",
        "tag": "03_firmware",
    },
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def make_gradient_bg(width, height):
    """Vertical gradient BG_TOP → BG_BOTTOM with a faint blue diagonal sweep."""
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / height
        # slight S-curve weight
        t2 = t * t * (3 - 2 * t)
        colour = lerp_color(BG_TOP, BG_BOTTOM, t2)
        draw.line([(0, y), (width, y)], fill=colour)
    return img


def draw_glow(canvas, cx, cy, radius, colour, alpha_max=80):
    """Paint a radial soft glow onto an RGBA canvas."""
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    steps = 60
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(alpha_max * (1 - i / steps) ** 1.5)
        gdraw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(*colour, a),
        )
    return Image.alpha_composite(canvas, glow)


def round_corners(img, radius):
    """Return image with rounded corners (RGBA)."""
    img = img.convert("RGBA")
    mask = Image.new("L", img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=radius, fill=255)
    img.putalpha(mask)
    return img


def drop_shadow(img, offset=(0, 30), blur=40, shadow_colour=(0, 0, 0), alpha=180):
    """Return a new RGBA image with a drop shadow behind img."""
    w, h = img.size
    ox, oy = offset
    pad = blur * 2
    result = Image.new("RGBA", (w + abs(ox) + pad * 2, h + abs(oy) + pad * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", result.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sx = pad + (ox if ox > 0 else 0)
    sy = pad + (oy if oy > 0 else 0)
    sdraw.rounded_rectangle(
        [sx, sy, sx + w - 1, sy + h - 1],
        radius=40,
        fill=(*shadow_colour, alpha),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    result = Image.alpha_composite(result, shadow)
    ix = pad + (0 if ox >= 0 else abs(ox))
    iy = pad + (0 if oy >= 0 else abs(oy))
    result.paste(img, (ix, iy), img)
    return result, (ix, iy)


def fit_text(draw, text, font_path, max_width, start_size=200, min_size=40):
    """Return (font, size) that fits text within max_width."""
    size = start_size
    while size >= min_size:
        try:
            font = ImageFont.truetype(font_path, size)
        except OSError:
            font = ImageFont.load_default()
        lines = text.split("\n")
        widths = [draw.textlength(line, font=font) for line in lines]
        if max(widths) <= max_width:
            return font, size
        size -= 4
    return ImageFont.truetype(font_path, min_size), min_size


def draw_multiline_centered(draw, text, font, y, canvas_width, fill, line_spacing=1.25):
    lines = text.split("\n")
    _, _, _, line_h = draw.textbbox((0, 0), "Ag", font=font)
    step = int(line_h * line_spacing)
    total_h = step * len(lines)
    cy = y
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text(((canvas_width - w) / 2, cy), line, font=font, fill=fill)
        cy += step
    return total_h


def draw_tag_pill(canvas_rgba, text, cx, y, font_path, font_size=52):
    """Draw a small rounded pill label (e.g. 'SHELLY MANAGER')."""
    draw = ImageDraw.Draw(canvas_rgba)
    try:
        font = ImageFont.truetype(font_path, font_size)
    except OSError:
        font = ImageFont.load_default()
    tw = draw.textlength(text, font=font)
    _, _, _, th = draw.textbbox((0, 0), text, font=font)
    pad_x, pad_y = 40, 20
    rx0 = cx - tw / 2 - pad_x
    ry0 = y - pad_y
    rx1 = cx + tw / 2 + pad_x
    ry1 = y + th + pad_y
    draw.rounded_rectangle([rx0, ry0, rx1, ry1], radius=60, fill=(*ACCENT, 220))
    draw.text((cx - tw / 2, y), text, font=font, fill=WHITE)
    return int(ry1 - ry0) + pad_y


def draw_decorative_dots(draw, x, y, cols=6, rows=4, spacing=38, colour=ACCENT, alpha=60):
    """Draw a subtle dot grid."""
    for r in range(rows):
        for c in range(cols):
            px = x + c * spacing
            py = y + r * spacing
            draw.ellipse([px - 3, py - 3, px + 3, py + 3], fill=(*colour, alpha))


# ── Core composer ─────────────────────────────────────────────────────────────

def measure_multiline(draw, text, font, line_spacing=1.25):
    """Return total pixel height of multi-line text block."""
    lines = text.split("\n")
    _, _, _, line_h = draw.textbbox((0, 0), "Ag", font=font)
    step = int(line_h * line_spacing)
    return step * len(lines)


def compose(
    shot_path,
    headline,
    subtitle,
    canvas_w,
    canvas_h,
    is_ipad=False,
):
    # ---- background ----
    bg = make_gradient_bg(canvas_w, canvas_h).convert("RGBA")

    # ---- load screenshot ----
    shot = Image.open(shot_path).convert("RGBA")
    sw, sh = shot.size

    # ---- scale screenshot to fill ~58 % of canvas height ----
    target_h = int(canvas_h * 0.58)
    scale = target_h / sh
    new_w = int(sw * scale)
    new_h = target_h
    shot = shot.resize((new_w, new_h), Image.LANCZOS)

    # Apply rounded corners
    corner_r = int(new_w * 0.045)
    shot = round_corners(shot, corner_r)

    # Add drop shadow
    shadow_img, (six, siy) = drop_shadow(shot, offset=(0, 25), blur=50, alpha=160)

    # ---- Measure text to build dynamic layout ----
    dummy_draw = ImageDraw.Draw(bg)

    pill_font_size  = 52 if not is_ipad else 60
    pill_y_top      = 80                                        # top of pill
    try:
        pill_font = ImageFont.truetype(FONT_REG, pill_font_size)
    except OSError:
        pill_font = ImageFont.load_default()
    _, _, _, pill_ch = dummy_draw.textbbox((0, 0), "Ag", font=pill_font)
    pill_total_h = pill_ch + 40 + 20                            # text + 2×pad_y + extra gap

    headline_start_y = pill_y_top + pill_total_h + 28

    headline_max_w  = int(canvas_w * 0.88)
    headline_size   = 165 if not is_ipad else 200
    hl_font, _      = fit_text(dummy_draw, headline, FONT_BLK,
                               headline_max_w, start_size=headline_size, min_size=60)
    hl_block_h      = measure_multiline(dummy_draw, headline, hl_font, line_spacing=1.15)

    gap_after_hl    = int(canvas_h * 0.04)
    shot_top        = headline_start_y + hl_block_h + gap_after_hl

    # Bottom subtitle zone: keep a fixed reserve at the bottom
    bottom_reserve  = int(canvas_h * 0.14)
    shot_bottom_max = canvas_h - bottom_reserve

    # Clamp screenshot if it would overflow
    avail_shot_h = shot_bottom_max - shot_top
    if shadow_img.height > avail_shot_h:
        scale2 = avail_shot_h / shadow_img.height
        new_w2 = int(shadow_img.width * scale2)
        new_h2 = avail_shot_h
        # Rebuild shot at new size
        shot2 = Image.open(shot_path).convert("RGBA")
        new_sw = int(sw * scale * scale2)
        new_sh = int(sh * scale * scale2)
        shot2 = shot2.resize((new_sw, new_sh), Image.LANCZOS)
        shot2 = round_corners(shot2, int(new_sw * 0.045))
        shadow_img, (six, siy) = drop_shadow(shot2, offset=(0, 25), blur=50, alpha=160)
        new_w, new_h = new_sw, new_sh

    # Center shadow horizontally, pin its top to shot_top
    sx = (canvas_w - shadow_img.width) // 2
    sy = shot_top

    # Draw glow behind screenshot
    glow_cx = canvas_w // 2
    glow_cy = sy + siy + new_h // 2
    bg = draw_glow(bg, glow_cx, glow_cy, int(new_w * 0.90), ACCENT, alpha_max=55)

    # Paste shadow+screenshot
    tmp = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    tmp.paste(shadow_img, (sx, sy), shadow_img)
    bg = Image.alpha_composite(bg, tmp)

    draw = ImageDraw.Draw(bg)

    # ---- decorative dots ----
    dot_sp = 52
    draw_decorative_dots(draw, canvas_w - 340, 60, cols=7, rows=5, spacing=dot_sp)
    draw_decorative_dots(draw, 60, canvas_h - 280, cols=5, rows=4, spacing=dot_sp)

    # ---- "SHELLY MANAGER" pill tag ----
    tag_h = draw_tag_pill(bg, "SHELLY MANAGER", canvas_w // 2, pill_y_top, FONT_REG, pill_font_size)
    draw = ImageDraw.Draw(bg)  # refresh after alpha_composite inside pill

    # ---- headline ----
    draw_multiline_centered(draw, headline, hl_font, headline_start_y, canvas_w,
                            fill=WHITE, line_spacing=1.15)

    # ---- subtitle (centred in the bottom reserve zone) ----
    sub_size    = 68 if not is_ipad else 78
    sub_max_w   = int(canvas_w * 0.82)
    sub_font, _ = fit_text(draw, subtitle, FONT_REG, sub_max_w, start_size=sub_size, min_size=34)
    sub_block_h = measure_multiline(draw, subtitle, sub_font, line_spacing=1.4)
    shot_actual_bottom = sy + shadow_img.height
    sub_zone_h  = canvas_h - shot_actual_bottom
    sub_y       = shot_actual_bottom + (sub_zone_h - sub_block_h) // 2
    draw_multiline_centered(draw, subtitle, sub_font, sub_y, canvas_w,
                            fill=LIGHT, line_spacing=1.4)

    # ---- thin accent bar at very bottom ----
    bar_h = max(8, canvas_h // 340)
    draw.rectangle([0, canvas_h - bar_h, canvas_w, canvas_h], fill=ACCENT)

    return bg.convert("RGB")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # iPhone — 1242 × 2688
    iphone_w, iphone_h = 1242, 2688
    for i, meta in enumerate(IPHONE_SHOTS, 1):
        path = os.path.join(SS_DIR, meta["file"])
        print(f"[iPhone {i}/{len(IPHONE_SHOTS)}] {meta['tag']} …")
        img = compose(path, meta["headline"], meta["subtitle"], iphone_w, iphone_h, is_ipad=False)
        out = os.path.join(OUT_IPHONE, f"{meta['tag']}.png")
        img.save(out, "PNG", optimize=True)
        print(f"  → {out}  ({img.size[0]}×{img.size[1]})")

    # iPad — 2048 × 2732
    ipad_w, ipad_h = 2048, 2732
    for i, meta in enumerate(IPAD_SHOTS, 1):
        path = os.path.join(SS_DIR, meta["file"])
        print(f"[iPad  {i}/{len(IPAD_SHOTS)}] {meta['tag']} …")
        img = compose(path, meta["headline"], meta["subtitle"], ipad_w, ipad_h, is_ipad=True)
        out = os.path.join(OUT_IPAD, f"{meta['tag']}.png")
        img.save(out, "PNG", optimize=True)
        print(f"  → {out}  ({img.size[0]}×{img.size[1]})")

    print("\nDone.")


if __name__ == "__main__":
    main()
