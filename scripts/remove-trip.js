#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3")
const fs = require("fs")
const path = require("path")
const readline = require("readline")

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const prompt = (question) => new Promise((resolve) => rl.question(question, resolve))

/**
 * List all objects in R2 with given prefix
 */
async function listObjects(prefix) {
  const objects = []
  let continuationToken

  do {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const response = await R2.send(command)
    if (response.Contents) {
      objects.push(...response.Contents)
    }
    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return objects
}

/**
 * Delete objects from R2
 */
async function deleteObjects(keys) {
  if (keys.length === 0) return 0

  // DeleteObjectsCommand supports max 1000 objects per request
  const chunks = []
  for (let i = 0; i < keys.length; i += 1000) {
    chunks.push(keys.slice(i, i + 1000))
  }

  let deleted = 0
  for (const chunk of chunks) {
    const command = new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Delete: {
        Objects: chunk.map(key => ({ Key: key })),
      },
    })

    const response = await R2.send(command)
    deleted += response.Deleted?.length || 0
  }

  return deleted
}

/**
 * Remove trip from trips.json
 */
function removeTripFromJson(tripName) {
  const tripsJsonPath = path.join(process.cwd(), "src", "data", "trips.json")

  if (!fs.existsSync(tripsJsonPath)) {
    console.error("trips.json not found")
    return false
  }

  const tripsData = JSON.parse(fs.readFileSync(tripsJsonPath, "utf8"))
  const initialLength = tripsData.trips.length
  tripsData.trips = tripsData.trips.filter(t => t.id !== tripName)

  if (tripsData.trips.length === initialLength) {
    console.log(`Trip "${tripName}" not found in trips.json`)
    return false
  }

  fs.writeFileSync(tripsJsonPath, JSON.stringify(tripsData, null, 2))
  return true
}

async function removeTrip(tripName) {
  console.log(`\nRemoving trip: ${tripName}\n`)

  // Step 1: List objects in R2
  console.log("Step 1: Listing objects in R2...")
  const prefix = `${tripName}/`
  const objects = await listObjects(prefix)

  if (objects.length === 0) {
    console.log(`  No objects found in R2 with prefix: ${prefix}`)
  } else {
    console.log(`  Found ${objects.length} objects in R2`)
  }

  // Step 2: Confirm deletion
  console.log("\nThis will:")
  console.log(`  - Delete ${objects.length} photos from R2`)
  console.log(`  - Remove trip entry from trips.json`)
  console.log(`  - Local files in public/photos/${tripName}/ will NOT be removed\n`)

  const confirm = await prompt("Are you sure? (y/N): ")
  rl.close()

  if (confirm.toLowerCase() !== "y") {
    console.log("Cancelled.")
    process.exit(0)
  }

  // Step 3: Delete from R2
  if (objects.length > 0) {
    console.log("\nStep 2: Deleting objects from R2...")
    const keys = objects.map(obj => obj.Key)
    const deleted = await deleteObjects(keys)
    console.log(`  Deleted ${deleted} objects from R2`)
  }

  // Step 4: Remove from trips.json
  console.log("\nStep 3: Removing from trips.json...")
  const removed = removeTripFromJson(tripName)
  if (removed) {
    console.log(`  Removed "${tripName}" from trips.json`)
  }

  console.log(`\n${"=".repeat(50)}`)
  console.log("Done!")
  console.log(`${"=".repeat(50)}`)
}

// Main execution
const tripName = process.argv[2]

if (!tripName) {
  console.log("Remove Trip Script")
  console.log("=".repeat(50))
  console.log("\nUsage: npm run remove-trip <trip-name>")
  console.log("\nExample:")
  console.log("  npm run remove-trip morocco-2019")
  console.log("\nThis will:")
  console.log("  - Delete all photos from R2 bucket")
  console.log("  - Remove trip entry from trips.json")
  console.log("  - Local files will NOT be removed")
  process.exit(0)
}

removeTrip(tripName).catch((error) => {
  console.error("Fatal error:", error)
  rl.close()
  process.exit(1)
})
