#!/usr/bin/env node
// Script to generate placeholder PWA icons
// Run: node generate-icons.js

const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, 'public', 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate SVG icons as placeholder (convert to PNG via canvas in build or use svg directly)
sizes.forEach(size => {
  const fontSize = Math.round(size * 0.4)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff7d0d"/>
      <stop offset="100%" style="stop-color:#c74a04"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" ry="${Math.round(size * 0.2)}"/>
    </clipPath>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#g)"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif" font-weight="900"
    font-size="${fontSize}" fill="white">P</text>
</svg>`

  // Write SVG (can be served as-is or converted to PNG)
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg)
  console.log(`✅ icon-${size}.svg`)
})

console.log('\n⚠️  SVG icons generated. For production PNG icons:')
console.log('   npm install -g sharp-cli')
console.log('   or use: https://realfavicongenerator.net')
