from pathlib import Path
from PIL import Image
import os

root = Path(__file__).resolve().parents[2] / 'uploads' / 'public_app'
folders = ('categories', 'products', 'restaurants')
max_edge = 512
total_before = 0
total_after = 0
optimized = 0

for folder in folders:
    pattern = '*.png' if folder == 'categories' else 'cat-*.png'
    for path in (root / folder).glob(pattern):
        before = path.stat().st_size
        with Image.open(path) as image:
            image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
            temp_path = path.with_name(path.stem + '.optimized.png')
            image.save(temp_path, format='PNG', optimize=True)
        os.replace(temp_path, path)
        total_before += before
        total_after += path.stat().st_size
        optimized += 1

print(f'Optimized {optimized} local images: {total_before // 1024} KB -> {total_after // 1024} KB')
