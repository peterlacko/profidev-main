#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Reprocess Photos Script
 *
 * Resizes, watermarks, and uploads photos without touching trips.json.
 * Use this to update photos with different watermark, resolution, or quality.
 *
 * Usage:
 *   node scripts/reprocess-photos.js <trip-name> [options]
 *
 * Options:
 *   --width <n>       Max width (default: 1920)
 *   --height <n>      Max height (default: 1080)
 *   --quality <n>     JPEG quality 1-100 (default: 95)
 *   --watermark <s>   Watermark text (default: "© Peter Lacko | profidev.sk")
 *   --opacity <n>     Watermark opacity 0-1 (default: 0.7)
 *   --font-size <n>   Watermark font size (default: 24)
 *   --no-watermark    Skip watermark entirely
 *   --no-upload       Skip R2 upload (local processing only)
 *   --force           Overwrite existing files in R2
 *   --dry-run         Show what would be done without processing
 *
 * Examples:
 *   node scripts/reprocess-photos.js uganda-2025
 *   node scripts/reprocess-photos.js uganda-2025 --quality 85 --width 2560
 *   node scripts/reprocess-photos.js uganda-2025 --no-watermark --force
 */

const sharp = require("sharp")
const path = require("path")
const fs = require("fs")

// Load env vars for R2
require("dotenv").config({ path: ".env.local" })

// Parse CLI arguments
const args = process.argv.slice(2)
const tripName = args.find(arg => !arg.startsWith("--"))

const getFlag = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`)
  if (index === -1) return defaultValue
  const nextArg = args[index + 1]
  if (!nextArg || nextArg.startsWith("--")) return true
  return nextArg
}

const hasFlag = (name) => args.includes(`--${name}`)

// Configuration from CLI args
const CONFIG = {
  maxWidth: parseInt(getFlag("width", "1920"), 10),
  maxHeight: parseInt(getFlag("height", "1080"), 10),
  jpegQuality: parseInt(getFlag("quality", "95"), 10),
  watermarkText: getFlag("watermark", "© Peter Lacko | profidev.sk"),
  watermarkOpacity: parseFloat(getFlag("opacity", "0.7")),
  watermarkFontSize: parseInt(getFlag("font-size", "24"), 10),
  watermarkPadding: 20,
  skipWatermark: hasFlag("no-watermark"),
  skipUpload: hasFlag("no-upload"),
  force: hasFlag("force"),
  dryRun: hasFlag("dry-run"),
}

// Show help
if (!tripName || hasFlag("help") || hasFlag("h")) {
  console.log(`
Reprocess Photos Script
=======================

Resizes, watermarks, and uploads photos without touching trips.json.

Usage:
  node scripts/reprocess-photos.js <trip-name> [options]

Options:
  --width <n>       Max width (default: 1920)
  --height <n>      Max height (default: 1080)
  --quality <n>     JPEG quality 1-100 (default: 95)
  --watermark <s>   Watermark text (default: "© Peter Lacko | profidev.sk")
  --opacity <n>     Watermark opacity 0-1 (default: 0.7)
  --font-size <n>   Watermark font size (default: 24)
  --no-watermark    Skip watermark entirely
  --no-upload       Skip R2 upload (local processing only)
  --force           Overwrite existing files in R2
  --dry-run         Show what would be done without processing

Examples:
  node scripts/reprocess-photos.js uganda-2025
  node scripts/reprocess-photos.js uganda-2025 --quality 85 --width 2560
  node scripts/reprocess-photos.js uganda-2025 --no-watermark --force
  node scripts/reprocess-photos.js uganda-2025 --dry-run
`)
  process.exit(0)
}

// R2 client setup (only if uploading)
let R2, PutObjectCommand, HeadObjectCommand
if (!CONFIG.skipUpload) {
  const requiredEnvVars = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]
  const missing = requiredEnvVars.filter(v => !process.env[v])
  if (missing.length > 0) {
    console.error(`Missing R2 env vars: ${missing.join(", ")}`)
    console.log("Use --no-upload to skip R2 upload, or set the environment variables.")
    process.exit(1)
  }

  const { S3Client, PutObjectCommand: Put, HeadObjectCommand: Head } = require("@aws-sdk/client-s3")
  PutObjectCommand = Put
  HeadObjectCommand = Head

  R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

async function createWatermarkSvg(width, height) {
  const padding = CONFIG.watermarkPadding
  const fontSize = Math.max(16, Math.min(CONFIG.watermarkFontSize, width / 40))

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
  `

  return Buffer.from(svg)
}

async function processImage(inputPath, outputPath) {
  // Step 1: Resize image
  let pipeline = sharp(inputPath).resize(CONFIG.maxWidth, CONFIG.maxHeight, {
    fit: "inside",
    withoutEnlargement: true,
  })

  const resizedBuffer = await pipeline.toBuffer()
  const { width, height } = await sharp(resizedBuffer).metadata()

  // Step 2: Apply watermark (if enabled)
  if (!CONFIG.skipWatermark) {
    const watermarkSvg = await createWatermarkSvg(width, height)
    pipeline = sharp(resizedBuffer).composite([
      { input: watermarkSvg, gravity: "southeast" },
    ])
  } else {
    pipeline = sharp(resizedBuffer)
  }

  // Step 3: Save as JPEG
  await pipeline.jpeg({ quality: CONFIG.jpegQuality }).toFile(outputPath)

  return { width, height }
}

async function objectExists(r2Key) {
  try {
    await R2.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
    }))
    return true
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return false
    throw err
  }
}

async function uploadToR2(localPath, r2Key) {
  const fileBuffer = fs.readFileSync(localPath)

  await R2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: "image/jpeg",
  }))
}

async function main() {
  const publicDir = path.join(process.cwd(), "public", "photos", tripName)
  const originalsDir = path.join(publicDir, "originals")

  if (!fs.existsSync(originalsDir)) {
    console.error(`Originals directory not found: ${originalsDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(originalsDir).filter(file => {
    const ext = path.extname(file).toLowerCase()
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
  })

  if (files.length === 0) {
    console.error("No image files found in originals directory.")
    process.exit(1)
  }

  // Print config summary
  console.log(`
Reprocess Photos: ${tripName}
${"=".repeat(40)}
Settings:
  Resolution:  ${CONFIG.maxWidth}x${CONFIG.maxHeight}
  Quality:     ${CONFIG.jpegQuality}%
  Watermark:   ${CONFIG.skipWatermark ? "DISABLED" : `"${CONFIG.watermarkText}" (opacity: ${CONFIG.watermarkOpacity})`}
  Upload:      ${CONFIG.skipUpload ? "DISABLED" : (CONFIG.force ? "ENABLED (force overwrite)" : "ENABLED (skip existing)")}
  Dry run:     ${CONFIG.dryRun ? "YES" : "NO"}

Found ${files.length} images to process.
`)

  if (CONFIG.dryRun) {
    console.log("DRY RUN - No changes will be made.\n")
    for (const file of files) {
      const outputFilename = path.basename(file, path.extname(file)) + ".jpg"
      console.log(`  Would process: ${file} -> ${outputFilename}`)
    }
    process.exit(0)
  }

  let processed = 0
  let uploaded = 0
  let skipped = 0
  const errors = []

  for (const file of files) {
    const inputPath = path.join(originalsDir, file)
    const outputFilename = path.basename(file, path.extname(file)) + ".jpg"
    const outputPath = path.join(publicDir, outputFilename)

    try {
      // Process image
      const { width, height } = await processImage(inputPath, outputPath)
      console.log(`✓ Processed: ${file} (${width}x${height})`)
      processed++

      // Upload to R2
      if (!CONFIG.skipUpload) {
        const r2Key = `${tripName}/${outputFilename}`

        if (!CONFIG.force && await objectExists(r2Key)) {
          console.log(`  ↳ Skipped upload (exists): ${r2Key}`)
          skipped++
        } else {
          await uploadToR2(outputPath, r2Key)
          console.log(`  ↳ Uploaded: ${r2Key}`)
          uploaded++
        }
      }
    } catch (err) {
      console.error(`✗ Error: ${file} - ${err.message}`)
      errors.push(file)
    }
  }

  // Summary
  console.log(`
${"=".repeat(40)}
Complete!
  Processed: ${processed}
  Uploaded:  ${uploaded}
  Skipped:   ${skipped}
  Errors:    ${errors.length}
${errors.length > 0 ? `\nFailed files: ${errors.join(", ")}` : ""}
Output: ${publicDir}
`)
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
