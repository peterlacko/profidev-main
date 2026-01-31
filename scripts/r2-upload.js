#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3")
const fs = require("fs")
const path = require("path")

// Load env vars (for local script execution)
require("dotenv").config({ path: ".env.local" })

// Validate required environment variables
const requiredEnvVars = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const MAX_RETRIES = 3

/**
 * Upload a file to R2 with retry logic
 * @param {string} localPath - Local file path
 * @param {string} r2Key - R2 object key (e.g., "trip-name/photo.jpg")
 * @returns {Promise<boolean>} - True if upload succeeded
 */
async function uploadToR2(localPath, r2Key) {
  const fileBuffer = fs.readFileSync(localPath)
  const contentType = "image/jpeg" // All processed photos are JPEG

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await R2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType,
      }))
      console.log(`  Uploaded: ${r2Key}`)
      return true
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.log(`  Retry ${attempt}/${MAX_RETRIES} for ${r2Key}: ${err.message}`)
      } else {
        console.error(`  Failed after ${MAX_RETRIES} attempts: ${r2Key}`)
        return false
      }
    }
  }
  return false
}

/**
 * Check if object exists in R2
 */
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

/**
 * Upload all photos from a trip folder to R2
 * @param {string} tripName - Trip folder name
 * @param {boolean} skipExisting - Skip files that already exist in R2
 * @returns {Promise<{uploaded: number, skipped: number, failed: string[]}>}
 */
async function uploadTrip(tripName, skipExisting = true) {
  const tripDir = path.join(process.cwd(), "public", "photos", tripName)

  if (!fs.existsSync(tripDir)) {
    console.error(`Trip directory not found: ${tripDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(tripDir).filter(f =>
    f.endsWith(".jpg") && !fs.statSync(path.join(tripDir, f)).isDirectory()
  )

  console.log(`\nUploading ${files.length} photos from ${tripName} to R2...\n`)

  let uploaded = 0
  let skipped = 0
  const failed = []

  for (const file of files) {
    const r2Key = `${tripName}/${file}`

    if (skipExisting && await objectExists(r2Key)) {
      console.log(`  Skipped (exists): ${r2Key}`)
      skipped++
      continue
    }

    const success = await uploadToR2(path.join(tripDir, file), r2Key)
    if (success) {
      uploaded++
    } else {
      failed.push(file)
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}`)
  if (failed.length > 0) {
    console.log(`Failed uploads: ${failed.join(", ")}`)
  }

  return { uploaded, skipped, failed }
}

module.exports = { uploadToR2, uploadTrip, objectExists }

// CLI execution
if (require.main === module) {
  const tripName = process.argv[2]
  if (!tripName) {
    console.log("Usage: node scripts/r2-upload.js <trip-name>")
    process.exit(0)
  }
  uploadTrip(tripName).catch(err => {
    console.error("Error:", err)
    process.exit(1)
  })
}
