#!/usr/bin/env python3
"""Export Relay identity assets. Requires Python Pillow and ImageMagick convert."""
from io import BytesIO
import math
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET

from PIL import Image

ASSETS = Path(__file__).resolve().parent
CSS = ASSETS.parent / 'apps/desktop/src/renderer/src/index.css'
SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)


def token_rgb(name):
    match = re.search(r'--' + re.escape(name) + r': oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\);', CSS.read_text())
    if not match:
        raise ValueError(f'Expected opaque OKLCH token: {name}')
    lightness, chroma, hue = map(float, match.groups())
    a, b = chroma * math.cos(math.radians(hue)), chroma * math.sin(math.radians(hue))
    lightness /= 100
    l = (lightness + .3963377774*a + .2158037573*b)**3
    m = (lightness - .1055613458*a - .0638541728*b)**3
    s = (lightness - .0894841775*a - 1.291485548*b)**3
    linear = (4.0767416621*l - 3.3077115913*m + .2309699292*s,
              -1.2684380046*l + 2.6097574011*m - .3413193965*s,
              -.0041960863*l - .7034186147*m + 1.707614701*s)
    if any(c < -.00001 or c > 1.00001 for c in linear):
        raise ValueError(f'{name} falls outside sRGB; choose an export-safe color')
    def encode(c):
        c = min(1, max(0, c))
        return round(255 * (12.92*c if c <= .0031308 else 1.055*c**(1/2.4)-.055))
    return '#' + ''.join(f'{encode(c):02x}' for c in linear)


def paint_svg(path, background, foreground):
    tree = ET.parse(path)
    for node in tree.iter():
        if node.tag == f'{{{SVG_NS}}}rect':
            node.set('fill', background)
        elif node.tag == f'{{{SVG_NS}}}path':
            node.set('fill', foreground)
    return ET.tostring(tree.getroot(), encoding='unicode') + '\n'


def export():
    convert = shutil.which('convert')
    if not convert:
        raise SystemExit('Install ImageMagick (convert) before exporting assets.')
    background, foreground = token_rgb('counter-accent'), token_rgb('on-primary')
    sources = {
        path: paint_svg(path, background, foreground)
        for path in [ASSETS/'desktop/app-icon.svg', ASSETS/'desktop/app-icon-small.svg',
                     ASSETS/'mobile/android-background.svg', ASSETS/'mobile/android-foreground.svg']
    }
    # Render all assets before replacing any tracked files.
    with tempfile.TemporaryDirectory(prefix='relay-icons-') as temporary:
        staging = Path(temporary)
        def render(svg, size):
            source = staging/'source.svg'
            source.write_text(svg)
            output = subprocess.run([convert, '-background', 'none', str(source),
                                     '-resize', f'{size}x{size}', '-depth', '8', 'png:-'],
                                    check=True, capture_output=True).stdout
            with Image.open(BytesIO(output)) as image:
                return image.convert('RGBA')

        normal = sources[ASSETS/'desktop/app-icon.svg']
        small = sources[ASSETS/'desktop/app-icon-small.svg']
        dev_sources = {}
        for name, source in [('app-icon-dev.svg', normal), ('app-icon-dev-small.svg', small)]:
            tree = ET.fromstring(source)
            tree.find(f'{{{SVG_NS}}}rect').set('fill', token_rgb('primary'))
            tree.find(f'{{{SVG_NS}}}title').text = 'Relay Dev — Continuum'
            # Vector DEV lettering stays independent of installed fonts.
            ET.SubElement(tree, f'{{{SVG_NS}}}path', {
                'd': 'M23 55H25Q28 55 28 57.5Q28 60 25 60H23Z M35 55H30V60H35 M30 57.5H34 M37 55L40 60L43 55',
                'fill': 'none', 'stroke': foreground, 'stroke-width': '1.4',
                'stroke-linejoin': 'round', 'stroke-linecap': 'round'
            })
            dev_sources[name] = ET.tostring(tree, encoding='unicode') + '\n'
        sizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256, 512, 1024]
        for suffix, variant_normal, variant_small in [('', normal, small),
                ('-dev', dev_sources['app-icon-dev.svg'], dev_sources['app-icon-dev-small.svg'])]:
            images = {size: render(variant_small if size <= 48 else variant_normal, size) for size in sizes}
            images[512].save(staging/f'icon{suffix}.png')
            ico_sizes = [(size, size) for size in sizes if size <= 256]
            images[256].save(staging/f'icon{suffix}.ico', sizes=ico_sizes,
                             append_images=[images[size] for size, _ in ico_sizes])
            # Explicit ICNS representations preserve both legacy small sizes and Retina sizes.
            entries = [(b'icp4',16),(b'icp5',32),(b'icp6',64),(b'ic07',128),(b'ic08',256),
                       (b'ic09',512),(b'ic10',1024),(b'ic11',32),(b'ic12',64),
                       (b'ic13',256),(b'ic14',512)]
            chunks = []
            for kind, size in entries:
                stream = BytesIO()
                images[size].save(stream, format='PNG')
                payload = stream.getvalue()
                chunks.append(kind + struct.pack('>I', len(payload)+8) + payload)
            body = b''.join(chunks)
            (staging/f'icon{suffix}.icns').write_bytes(b'icns' + struct.pack('>I', len(body)+8) + body)
        # Store icons are opaque and square; launchers apply their own masks.
        mobile = ET.fromstring(normal)
        mobile.find(f'{{{SVG_NS}}}rect').set('rx', '0')
        mobile_svg = ET.tostring(mobile, encoding='unicode')
        for size, filename in [(1024,'icon-1024.png'),(512,'play-store-512.png')]:
            render(mobile_svg, size).convert('RGB').save(staging/filename)
        for path, svg in sources.items():
            path.write_text(svg)
        for name, svg in dev_sources.items():
            (ASSETS/'desktop'/name).write_text(svg)
        for filename in ['icon.png','icon.ico','icon.icns','icon-dev.png','icon-dev.ico','icon-dev.icns']:
            shutil.copyfile(staging/filename, ASSETS/'desktop'/filename)
        for filename in ['icon-1024.png','play-store-512.png']:
            shutil.copyfile(staging/filename, ASSETS/'mobile'/filename)
    print(f'Exported Relay icons: {background} background, {foreground} mark.')


if __name__ == '__main__':
    export()
