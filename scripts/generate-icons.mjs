import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

// シンプルな棚(在庫)アイコン。#2563eb(blue-600)背景に白い棚のバーを描く。
function makeSvg(size, { padding = 0 } = {}) {
  const inner = size - padding * 2;
  const barHeight = inner * 0.1;
  const gap = inner * 0.14;
  const barWidth = inner * 0.62;
  const x = padding + (inner - barWidth) / 2;
  const bars = [0, 1, 2].map((i) => {
    const y = padding + inner * 0.22 + i * (barHeight + gap);
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="#ffffff"/>`;
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#2563eb"/>
  ${bars.join("\n")}
</svg>`.trim();
}

async function generate(size, filename, opts) {
  const svg = makeSvg(size, opts);
  await sharp(Buffer.from(svg)).png().toFile(path.join(publicDir, filename));
  console.log("generated", filename);
}

await generate(192, "icon-192.png");
await generate(512, "icon-512.png");
await generate(512, "icon-maskable-512.png", { padding: 512 * 0.15 });
await generate(180, "apple-touch-icon.png");
