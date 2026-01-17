#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Watermark Script for Travel Photography Portfolio
 *
 * Usage: node scripts/watermark.js [trip-folder-name]
 *
 * This script:
 * - Takes photos from /public/photos/[trip-name]/originals/
 * - Applies watermark overlay (text)
 * - Resizes to max 1920px width (maintaining aspect ratio)
 * - Outputs to /public/photos/[trip-name]/
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Configuration
const CONFIG = {
  maxWidth: 1920,
  maxHeight: 1080,
  watermarkText: "© Your Name | yourwebsite.com",
  watermarkOpacity: 0.7,
  watermarkFontSize: 24,
  watermarkPadding: 20,
  jpegQuality: 85,
};

async function createWatermarkSvg(width, height) {
  const padding = CONFIG.watermarkPadding;
  const fontSize = Math.max(16, Math.min(CONFIG.watermarkFontSize, width / 40));

  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="black" flood-opacity="0.5"/>
        </filter>
      </defs>
      <text
        x="${width - padding}"
        y="${height - padding}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        fill="white"
        fill-opacity="${CONFIG.watermarkOpacity}"
        text-anchor="end"
        filter="url(#shadow)"
      >${CONFIG.watermarkText}</text>
    </svg>
  `;

  return Buffer.from(svg);
}

async function processImage(inputPath, outputPath) {
  try {
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();

    // Calculate new dimensions (maintaining aspect ratio)
    let width = metadata.width;
    let height = metadata.height;

    if (width > CONFIG.maxWidth) {
      height = Math.round(height * (CONFIG.maxWidth / width));
      width = CONFIG.maxWidth;
    }

    if (height > CONFIG.maxHeight) {
      width = Math.round(width * (CONFIG.maxHeight / height));
      height = CONFIG.maxHeight;
    }

    // Create watermark SVG
    const watermarkSvg = await createWatermarkSvg(width, height);

    // Process image
    await sharp(inputPath)
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .composite([
        {
          input: watermarkSvg,
          gravity: "southeast",
        },
      ])
      .jpeg({ quality: CONFIG.jpegQuality })
      .toFile(outputPath);

    console.log(`✓ Processed: ${path.basename(inputPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(inputPath)}:`, error.message);
    return false;
  }
}

async function processTrip(tripName) {
  const publicDir = path.join(process.cwd(), "public", "photos", tripName);
  const originalsDir = path.join(publicDir, "originals");

  // Check if originals directory exists
  if (!fs.existsSync(originalsDir)) {
    console.error(`Error: Originals directory not found: ${originalsDir}`);
    console.log("\nExpected structure:");
    console.log(`  /public/photos/${tripName}/originals/`);
    console.log("  Place your original photos in this folder.");
    process.exit(1);
  }

  // Get all image files
  const files = fs.readdirSync(originalsDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  });

  if (files.length === 0) {
    console.error("Error: No image files found in originals directory.");
    process.exit(1);
  }

  console.log(`\nProcessing ${files.length} images from trip: ${tripName}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const inputPath = path.join(originalsDir, file);
    const outputFilename = path.basename(file, path.extname(file)) + ".jpg";
    const outputPath = path.join(publicDir, outputFilename);

    const success = await processImage(inputPath, outputPath);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Processing complete!`);
  console.log(`  ✓ Success: ${successCount}`);
  if (errorCount > 0) {
    console.log(`  ✗ Errors: ${errorCount}`);
  }
  console.log(`\nOutput directory: ${publicDir}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Update src/data/trips.json with photo metadata`);
  console.log(`  2. Commit and push to deploy`);
}

// Main execution
const tripName = process.argv[2];

if (!tripName) {
  console.log("Watermark Script for Travel Photography Portfolio");
  console.log("=".repeat(45));
  console.log("\nUsage: node scripts/watermark.js [trip-folder-name]");
  console.log("\nExample: node scripts/watermark.js patagonia-2024");
  console.log("\nThis will process images from:");
  console.log("  /public/photos/patagonia-2024/originals/");
  console.log("\nAnd output watermarked images to:");
  console.log("  /public/photos/patagonia-2024/");
  process.exit(0);
}

processTrip(tripName).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
