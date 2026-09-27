import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Master SVG Design with high fidelity styling
const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16191e"/>
      <stop offset="100%" stop-color="#0c0e10"/>
    </linearGradient>
    <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d8ff35"/>
      <stop offset="100%" stop-color="#b8f500"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)"/>
  
  <!-- Subtle Border Glow -->
  <rect x="6" y="6" width="500" height="500" rx="116" fill="none" stroke="#d8ff35" stroke-opacity="0.25" stroke-width="6"/>

  <!-- Main Plate Container with Shadow -->
  <g filter="url(#shadow)">
    <!-- Plate Background (White Body) -->
    <rect x="44" y="156" width="424" height="200" rx="28" fill="#ffffff" stroke="#d8ff35" stroke-width="10"/>
    
    <!-- TR Blue Segment -->
    <path d="M 44 184 C 44 168.5 56.5 156 72 156 L 140 156 L 140 356 L 72 356 C 56.5 356 44 343.5 44 328 Z" fill="#1e4fc2"/>
    
    <!-- TR Text -->
    <text x="92" y="278" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Space Grotesk', sans-serif" font-weight="900" font-size="54" fill="#ffffff" text-anchor="middle" letter-spacing="1">TR</text>
    
    <!-- Star accent above TR -->
    <circle cx="92" cy="195" r="7" fill="#ffffff" opacity="0.9"/>
    
    <!-- Plate Main Text: PLAKALA -->
    <text x="304" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Space Grotesk', sans-serif" font-weight="900" font-size="62" fill="#111315" text-anchor="middle" letter-spacing="3">PLAKALA</text>

    <!-- Holographic security strip line on top of plate -->
    <rect x="144" y="162" width="318" height="4" fill="#d8ff35" opacity="0.7"/>
  </g>

  <!-- Top Kinetic Neon Badge / Radar Beacon -->
  <g filter="url(#glow)">
    <rect x="206" y="70" width="100" height="34" rx="17" fill="#d8ff35"/>
    <text x="256" y="93" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="16" fill="#111315" text-anchor="middle" letter-spacing="2">ONLINE</text>
  </g>

  <!-- Small vehicle sensor wave dots -->
  <circle cx="160" cy="87" r="4" fill="#d8ff35" opacity="0.6"/>
  <circle cx="180" cy="87" r="5" fill="#d8ff35" opacity="0.8"/>
  <circle cx="332" cy="87" r="5" fill="#d8ff35" opacity="0.8"/>
  <circle cx="352" cy="87" r="4" fill="#d8ff35" opacity="0.6"/>

  <!-- Bottom Brand Subtitle -->
  <text x="256" y="420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" fill="#8e99a8" text-anchor="middle" letter-spacing="4">KORNAYA GEREK YOK</text>
</svg>`;

// 2. Maskable Icon SVG (with 15% safe-zone margin for Android adaptive icon clipping)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16191e"/>
      <stop offset="100%" stop-color="#0c0e10"/>
    </linearGradient>
    <filter id="shadowMask" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Full-bleed background for maskable -->
  <rect width="512" height="512" fill="url(#bgGradMask)"/>

  <!-- Centered Scaled Plate within 80% safe zone -->
  <g transform="translate(256, 256) scale(0.76) translate(-256, -256)">
    <!-- Main Plate -->
    <g filter="url(#shadowMask)">
      <rect x="44" y="156" width="424" height="200" rx="28" fill="#ffffff" stroke="#d8ff35" stroke-width="12"/>
      <path d="M 44 184 C 44 168.5 56.5 156 72 156 L 140 156 L 140 356 L 72 356 C 56.5 356 44 343.5 44 328 Z" fill="#1e4fc2"/>
      <text x="92" y="278" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="54" fill="#ffffff" text-anchor="middle">TR</text>
      <circle cx="92" cy="195" r="7" fill="#ffffff" opacity="0.9"/>
      <text x="304" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="62" fill="#111315" text-anchor="middle" letter-spacing="3">PLAKALA</text>
      <rect x="144" y="162" width="318" height="4" fill="#d8ff35" opacity="0.7"/>
    </g>

    <!-- Top Beacon -->
    <rect x="206" y="70" width="100" height="34" rx="17" fill="#d8ff35"/>
    <text x="256" y="93" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="16" fill="#111315" text-anchor="middle" letter-spacing="2">ONLINE</text>

    <!-- Bottom Subtitle -->
    <text x="256" y="420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" fill="#8e99a8" text-anchor="middle" letter-spacing="4">KORNAYA GEREK YOK</text>
  </g>
</svg>`;

async function generateAssets() {
  console.log('Generating PWA icons...');

  // Write SVGs
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterSvg);
  fs.writeFileSync('icon.svg', masterSvg);

  const svgBuffer = Buffer.from(masterSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Generate PNGs in public/
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon-64x64.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Also write to root for any direct paths
  await sharp(svgBuffer).resize(512, 512).png().toFile('pwa-512x512.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile('pwa-192x192.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile('apple-touch-icon.png');
  await sharp(maskableBuffer).resize(512, 512).png().toFile('pwa-maskable-512x512.png');

  console.log('PWA icons successfully generated!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
