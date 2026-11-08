"""Compose captured app frames into the branded 16:9 promotional GIF."""
import argparse
import logging
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

logging.basicConfig(level=logging.INFO, format='%(message)s')
ROOT = Path(__file__).resolve().parent.parent
BG = '#1a1a1a'
CYAN = '#00aeef'
ORANGE = '#ff9200'
TEXT = '#e0e0e0'


def font(size, weight='Regular'):
    return ImageFont.truetype(f'C:/Windows/Fonts/Montserrat-{weight}.otf', size)


def compose(screen, caption, progress, playing=False):
    frame = Image.new('RGB', (848, 477), BG)
    draw = ImageDraw.Draw(frame)
    draw.text((24, 17), '601MEDIA', font=font(13, 'Bold'), fill=CYAN)
    draw.text((23, 36), 'Teleprompter', font=font(29, 'SemiBold'), fill=TEXT)
    draw.rounded_rectangle((689, 26, 824, 53), radius=13, fill='#232323', outline='#3a3a3a')
    draw.ellipse((701, 36, 707, 42), fill=ORANGE if playing else CYAN)
    draw.text((715, 32), 'PRODUCTION', font=font(10, 'SemiBold'), fill=TEXT)
    screen = screen.resize((800, 320), Image.Resampling.LANCZOS)
    frame.paste(screen, (24, 87))
    draw.rounded_rectangle((23, 86, 824, 407), radius=4, outline='#444444', width=1)
    draw.line((24, 410, 824, 410), fill='#333333', width=2)
    if progress:
        draw.line((24, 410, 24 + int(800 * progress), 410), fill=CYAN, width=2)
    draw.text((24, 429), caption, font=font(14, 'Medium'), fill=TEXT)
    label = '601media.com'
    label_font = font(11)
    draw.text((824 - draw.textlength(label, font=label_font), 433), label, font=label_font, fill='#a0a0a0')
    return frame


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('frames_dir', type=Path, help='Frame directory printed by capture-promo.mjs')
    source = parser.parse_args().frames_dir
    with Image.open(source / 'ready.png') as image:
        ready = image.convert('RGB')
    with Image.open(source / 'paused.png') as image:
        paused = image.convert('RGB')
    start = compose(ready, 'Your script. Your pace. Your next production.', 0)
    frames = [start.copy() for _ in range(24)]
    for i in range(160):
        with Image.open(source / f'{i:03}.png') as image:
            screen = image.convert('RGB')
        frame = compose(screen, 'Stay on message. Keep your eyes on the lens.', (i + 1) / 160, True)
        if i < 6:
            frame = Image.blend(start, frame, (i + 1) / 6)
        frames.append(frame)
    last = compose(paused, 'Pause. Adjust. Keep rolling.', 1)
    frames.extend(last.copy() for _ in range(20))
    frames.extend(Image.blend(last, start, (i + 1) / 12) for i in range(12))
    # A shared palette prevents color shimmer as the white script moves.
    sheet = Image.new('RGB', (848, 477 * 5))
    for i, index in enumerate([0, 30, 90, 160, 190]):
        sheet.paste(frames[index], (0, 477 * i))
    palette = sheet.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    target = ROOT / 'assets/images/teleprompter-promo.gif'
    target.parent.mkdir(parents=True, exist_ok=True)
    indexed[0].save(target, save_all=True, append_images=indexed[1:], duration=50, loop=0, optimize=True, disposal=1)
    with Image.open(target) as gif:
        duration = 0
        for i in range(gif.n_frames):
            gif.seek(i)
            gif.load()
            duration += gif.info.get('duration', 0)
        if gif.size != (848, 477) or gif.n_frames < 100 or gif.info.get('loop') != 0:
            raise RuntimeError('GIF validation failed')
        logging.info('Created %s: %s frames, %.1fs, %.2f MB', target, gif.n_frames, duration / 1000, target.stat().st_size / 1024**2)
    start.save(target.with_suffix('.png'))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        logging.exception('Unable to build promotional GIF')
        raise
