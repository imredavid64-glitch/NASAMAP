import sharp from "sharp";
import fs from "fs";
import path from "path";

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0b1120"/>
  <circle cx="32" cy="32" r="22" fill="none" stroke="#22d3ee" stroke-width="3"
    stroke-dasharray="34 16" stroke-linecap="round" transform="rotate(-25 32 32)"/>
  <path d="M32 16 L40 26 H36 V40 H28 V26 H24 Z" fill="#22d3ee"/>
  <circle cx="32" cy="46" r="3.2" fill="#fbbf24"/>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(process.cwd(), "public");
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sizes = [192, 512];
  
  for (const size of sizes) {
    const svgBuffer = Buffer.from(svgIcon.replace('viewBox="0 0 64 64"', `width="${size}" height="${size}" viewBox="0 0 64 64"`));
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    
    console.log(`Generated icon-${size}.png`);
  }
  
  // Also generate a favicon
  await sharp(Buffer.from(svgIcon.replace('viewBox="0 0 64 64"', 'width="32" height="32" viewBox="0 0 64 64"')))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, "favicon.png"));
  
  console.log("Generated favicon.png");
}

generateIcons().catch(console.error);