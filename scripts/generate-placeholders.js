#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

/**
 * Generate placeholder images for development
 *
 * Usage: node scripts/generate-placeholders.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const photos = [
  // Patagonia
  {
    path: "patagonia-2024/torres-del-paine.jpg",
    color: { r: 100, g: 130, b: 180 },
    text: "Torres del Paine",
  },
  {
    path: "patagonia-2024/glacier-perito-moreno.jpg",
    color: { r: 180, g: 220, b: 240 },
    text: "Perito Moreno",
  },
  {
    path: "patagonia-2024/guanaco-patagonia.jpg",
    color: { r: 180, g: 150, b: 100 },
    text: "Guanaco",
  },
  // Japan
  {
    path: "japan-spring-2024/cherry-blossoms-kyoto.jpg",
    color: { r: 255, g: 200, b: 210 },
    text: "Cherry Blossoms",
  },
  {
    path: "japan-spring-2024/tokyo-shibuya.jpg",
    color: { r: 40, g: 40, b: 60 },
    text: "Shibuya",
  },
  {
    path: "japan-spring-2024/mount-fuji.jpg",
    color: { r: 200, g: 180, b: 220 },
    text: "Mount Fuji",
  },
  // Iceland
  {
    path: "iceland-2023/aurora-borealis.jpg",
    color: { r: 20, g: 60, b: 40 },
    text: "Aurora",
  },
  {
    path: "iceland-2023/black-sand-beach.jpg",
    color: { r: 40, g: 40, b: 45 },
    text: "Black Sand",
  },
];

async function createPlaceholder(photo) {
  const outputPath = path.join(
    process.cwd(),
    "public",
    "photos",
    photo.path
  );

  // Create SVG with text
  const width = 1200;
  const height = 800;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${photo.color.r},${photo.color.g},${photo.color.b})"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="48"
        fill="rgba(255,255,255,0.5)"
        text-anchor="middle"
        dominant-baseline="middle"
      >${photo.text}</text>
      <text
        x="50%"
        y="60%"
        font-family="Arial, sans-serif"
        font-size="24"
        fill="rgba(255,255,255,0.3)"
        text-anchor="middle"
        dominant-baseline="middle"
      >Placeholder Image</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toFile(outputPath);

  console.log(`Created: ${photo.path}`);
}

async function main() {
  console.log("Generating placeholder images...\n");

  for (const photo of photos) {
    await createPlaceholder(photo);
  }

  console.log("\nDone! Placeholder images created.");
  console.log("\nNote: Replace these with real photos when ready.");
}

main().catch(console.error);
