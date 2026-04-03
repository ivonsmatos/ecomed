// Script para gerar ícones PWA usando sharp (já instalado no projeto)
// Execute: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join } from "path";

const sizes = [192, 512];
const outDir = join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const arm = Math.round(size * 0.14);
  const mid = Math.round(size / 2);
  const half = Math.round(size * 0.28);
  const r = Math.round(size * 0.18);

  // SVG com fundo verde arredondado + cruz branca
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#16a34a"/>
  <rect x="${mid - arm}" y="${mid - half}" width="${arm * 2}" height="${half * 2}" fill="#ffffff"/>
  <rect x="${mid - half}" y="${mid - arm}" width="${half * 2}" height="${arm * 2}" fill="#ffffff"/>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(outDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

console.log("Ícones gerados em public/icons/");
