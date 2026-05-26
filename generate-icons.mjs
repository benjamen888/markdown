import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('icons/icon.svg');

for (const size of [16, 48, 128]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`icons/icon${size}.png`);
  console.log(`Generated icons/icon${size}.png`);
}
