#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Add Trip Script - Automates photo processing and trips.json update
 *
 * Usage: npm run add-trip <trip-name>
 *
 * This script:
 * 1. Prompts for country, region (optional), and date
 * 2. Runs watermark.js on the trip's originals folder
 * 3. Uploads to R2
 * 4. Generates template entries in trips.json based on photo filenames
 */

const path = require("path")
const fs = require("fs")
const { execSync } = require("child_process")
const readline = require("readline")

// Category keywords mapping - filename contains keyword -> assign category
const CATEGORY_KEYWORDS = {
  mountain: "mountains",
  peak: "mountains",
  summit: "mountains",
  hill: "mountains",
  volcano: "mountains",
  city: "city",
  street: "city",
  building: "city",
  urban: "city",
  tower: "city",
  skyline: "city",
  animal: "animals",
  bird: "animals",
  elephant: "animals",
  monkey: "animals",
  chimp: "animals",
  lion: "animals",
  tiger: "animals",
  fish: "animals",
  whale: "animals",
  dog: "animals",
  cat: "animals",
  horse: "animals",
  cow: "animals",
  deer: "animals",
  bear: "animals",
  forest: "nature",
  tree: "nature",
  flower: "nature",
  plant: "nature",
  jungle: "nature",
  river: "nature",
  waterfall: "nature",
  lake: "nature",
  ocean: "nature",
  beach: "nature",
  sea: "nature",
  landscape: "landscape",
  view: "landscape",
  panorama: "landscape",
  sunset: "landscape",
  sunrise: "landscape",
  sky: "landscape",
  cloud: "landscape",
  field: "landscape",
  valley: "landscape",
  temple: "culture",
  church: "culture",
  mosque: "culture",
  market: "culture",
  festival: "culture",
  traditional: "culture",
  local: "culture",
  people: "culture",
  portrait: "culture",
  worker: "culture",
  fisherman: "culture",
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const prompt = (question) => new Promise((resolve) => rl.question(question, resolve))

/**
 * Convert filename to readable caption
 */
const filenameToCaption = (filename) => {
  const name = path.basename(filename, path.extname(filename))
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Derive categories from filename
 */
const deriveCategories = (filename) => {
  const name = path.basename(filename, path.extname(filename)).toLowerCase()
  const categories = new Set()

  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (name.includes(keyword)) {
      categories.add(category)
    }
  }

  if (categories.size === 0) {
    categories.add("landscape")
  }

  return Array.from(categories)
}

/**
 * Generate trip title from trip name
 */
const tripNameToTitle = (tripName) =>
  tripName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

async function addTrip(tripName) {
  const publicDir = path.join(process.cwd(), "public", "photos", tripName)
  const originalsDir = path.join(publicDir, "originals")
  const tripsJsonPath = path.join(process.cwd(), "src", "data", "trips.json")

  // Check if originals directory exists
  if (!fs.existsSync(originalsDir)) {
    console.error(`Error: Originals directory not found: ${originalsDir}`)
    console.log("\nCreate the folder and add your photos first:")
    console.log(`  mkdir -p public/photos/${tripName}/originals`)
    console.log(`  # Then copy your photos to that folder`)
    rl.close()
    process.exit(1)
  }

  // Get image files from originals
  const imageFiles = fs.readdirSync(originalsDir).filter((file) => {
    const ext = path.extname(file).toLowerCase()
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
  })

  if (imageFiles.length === 0) {
    console.error("Error: No image files found in originals directory.")
    rl.close()
    process.exit(1)
  }

  console.log(`\nFound ${imageFiles.length} images in ${tripName}/originals\n`)

  // Prompt for trip details
  const country = await prompt("Country: ")
  if (!country.trim()) {
    console.error("Error: Country is required")
    rl.close()
    process.exit(1)
  }

  const region = await prompt("Region (optional, press Enter to skip): ")
  const dateInput = await prompt(`Date (YYYY-MM, default: ${new Date().toISOString().slice(0, 7)}): `)
  const date = dateInput.trim() || new Date().toISOString().slice(0, 7)

  rl.close()

  // Step 1: Run watermark script
  console.log("\nStep 1: Processing images with watermark...\n")
  try {
    execSync(`node scripts/watermark.js ${tripName}`, { stdio: "inherit" })
  } catch {
    console.error("Error running watermark script")
    process.exit(1)
  }

  // Step 2: Upload to R2
  console.log("\nStep 2: Uploading to R2...\n")
  const { uploadTrip } = require("./r2-upload")
  const { failed } = await uploadTrip(tripName, true)

  if (failed.length > 0) {
    console.error("\nSome uploads failed. Fix issues and retry with: npm run r2-upload " + tripName)
    process.exit(1)
  }

  // Step 3: Clean up local watermarked files (keep originals)
  console.log("\nStep 3: Cleaning up local files...\n")
  const watermarkedFiles = fs.readdirSync(publicDir).filter(f =>
    f.endsWith(".jpg") && !fs.statSync(path.join(publicDir, f)).isDirectory()
  )
  for (const file of watermarkedFiles) {
    fs.unlinkSync(path.join(publicDir, file))
    console.log(`  Deleted: ${file}`)
  }

  // Step 4: Generate trip entry
  console.log("\nStep 4: Generating trips.json entry...\n")

  const allCategories = new Set()
  const photos = imageFiles.map((file) => {
    const outputFilename = path.basename(file, path.extname(file)) + ".jpg"
    const caption = filenameToCaption(file)
    const categories = deriveCategories(file)

    categories.forEach((cat) => allCategories.add(cat))

    return {
      filename: outputFilename,
      caption: {
        en: caption,
        sk: `[SK] ${caption}`,
      },
      categories,
    }
  })

  const newTrip = {
    id: tripName,
    title: {
      en: tripNameToTitle(tripName),
      sk: `[SK] ${tripNameToTitle(tripName)}`,
    },
    country: country.trim(),
    ...(region.trim() && { region: region.trim() }),
    date,
    featured: false,
    categories: Array.from(allCategories),
    photos,
  }

  // Step 5: Update trips.json
  let tripsData = { trips: [] }
  if (fs.existsSync(tripsJsonPath)) {
    tripsData = JSON.parse(fs.readFileSync(tripsJsonPath, "utf8"))
  }

  const existingIndex = tripsData.trips.findIndex((t) => t.id === tripName)
  if (existingIndex !== -1) {
    console.log(`Trip "${tripName}" already exists. Updating photos...`)
    tripsData.trips[existingIndex] = {
      ...tripsData.trips[existingIndex],
      photos,
      categories: Array.from(allCategories),
    }
  } else {
    console.log(`Adding new trip: "${tripName}"`)
    tripsData.trips.unshift(newTrip)
  }

  fs.writeFileSync(tripsJsonPath, JSON.stringify(tripsData, null, 2))

  // Summary
  console.log(`\n${"=".repeat(50)}`)
  console.log("Done!")
  console.log(`${"=".repeat(50)}`)
  console.log(`\nTrip: ${tripName}`)
  console.log(`Country: ${country.trim()}`)
  if (region.trim()) {
    console.log(`Region: ${region.trim()}`)
  }
  console.log(`Photos: ${photos.length}`)
  console.log(`Categories: ${Array.from(allCategories).join(", ")}`)
  console.log(`\nGenerated entries in: src/data/trips.json`)
  console.log(`\nNext steps:`)
  console.log(`  1. Edit src/data/trips.json to:`)
  console.log(`     - Update Slovak translations (replace [SK] placeholders)`)
  console.log(`     - Refine English captions`)
  console.log(`     - Adjust categories if needed`)
  console.log(`     - Set featured: true if desired`)
  console.log(`  2. Commit trips.json and push to deploy`)
  console.log(`     (Photos are already uploaded to R2)`)
}

// Main execution
const tripName = process.argv[2]

if (!tripName) {
  console.log("Add Trip Script - Automate photo processing")
  console.log("=".repeat(50))
  console.log("\nUsage: npm run add-trip <trip-name>")
  console.log("\nExample:")
  console.log("  npm run add-trip svalbard-2024")
  console.log("\nThe script will prompt for:")
  console.log("  - Country (required)")
  console.log("  - Region (optional)")
  console.log("  - Date (optional, defaults to current month)")
  console.log("\nBefore running, create folder and add photos:")
  console.log("  mkdir -p public/photos/<trip-name>/originals")
  console.log("  # Copy photos to that folder")
  console.log("\nPhoto naming tips:")
  console.log("  - Name photos descriptively: mountain-sunset.jpg, elephant.jpg")
  console.log("  - Categories auto-detected from filenames")
  process.exit(0)
}

addTrip(tripName).catch((error) => {
  console.error("Fatal error:", error)
  rl.close()
  process.exit(1)
})
