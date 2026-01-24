#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Add Trip Script - Automates photo processing and trips.json update
 *
 * Usage: node scripts/add-trip.js [trip-name] [country] [date]
 *
 * Example: node scripts/add-trip.js peru-2024 Peru 2024-06
 *
 * This script:
 * 1. Runs watermark.js on the trip's originals folder
 * 2. Generates template entries in trips.json based on photo filenames
 * 3. Derives categories from filename keywords
 */

const path = require("path")
const fs = require("fs")
const { execSync } = require("child_process")

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

/**
 * Convert filename to readable caption
 * e.g., "mountain_sunset" -> "Mountain sunset"
 */
function filenameToCaption(filename) {
  const name = path.basename(filename, path.extname(filename))
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Derive categories from filename
 */
function deriveCategories(filename) {
  const name = path.basename(filename, path.extname(filename)).toLowerCase()
  const categories = new Set()

  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (name.includes(keyword)) {
      categories.add(category)
    }
  }

  // Default to landscape if no categories found
  if (categories.size === 0) {
    categories.add("landscape")
  }

  return Array.from(categories)
}

/**
 * Generate trip title from trip name
 * e.g., "peru-2024" -> "Peru 2024"
 */
function tripNameToTitle(tripName) {
  return tripName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

async function addTrip(tripName, country, date) {
  const publicDir = path.join(process.cwd(), "public", "photos", tripName)
  const originalsDir = path.join(publicDir, "originals")
  const tripsJsonPath = path.join(process.cwd(), "src", "data", "trips.json")

  // Check if originals directory exists
  if (!fs.existsSync(originalsDir)) {
    console.error(`Error: Originals directory not found: ${originalsDir}`)
    console.log("\nCreate the folder and add your photos first:")
    console.log(`  mkdir -p public/photos/${tripName}/originals`)
    console.log(`  # Then copy your photos to that folder`)
    process.exit(1)
  }

  // Get image files from originals
  const imageFiles = fs.readdirSync(originalsDir).filter((file) => {
    const ext = path.extname(file).toLowerCase()
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
  })

  if (imageFiles.length === 0) {
    console.error("Error: No image files found in originals directory.")
    process.exit(1)
  }

  console.log(`\nFound ${imageFiles.length} images in ${tripName}/originals\n`)

  // Step 1: Run watermark script
  console.log("Step 1: Processing images with watermark...\n")
  try {
    execSync(`node scripts/watermark.js ${tripName}`, { stdio: "inherit" })
  } catch {
    console.error("Error running watermark script")
    process.exit(1)
  }

  // Step 2: Generate trip entry
  console.log("\nStep 2: Generating trips.json entry...\n")

  // Collect all categories from photos
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
        sk: `[SK] ${caption}`, // Placeholder for Slovak translation
      },
      categories,
    }
  })

  const newTrip = {
    id: tripName,
    title: {
      en: tripNameToTitle(tripName),
      sk: `[SK] ${tripNameToTitle(tripName)}`, // Placeholder for Slovak translation
    },
    country: country || "Unknown",
    date: date || new Date().toISOString().slice(0, 7), // YYYY-MM
    featured: false,
    categories: Array.from(allCategories),
    photos,
  }

  // Step 3: Update trips.json
  let tripsData = { trips: [] }
  if (fs.existsSync(tripsJsonPath)) {
    tripsData = JSON.parse(fs.readFileSync(tripsJsonPath, "utf8"))
  }

  // Check if trip already exists
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
    tripsData.trips.unshift(newTrip) // Add to beginning
  }

  fs.writeFileSync(tripsJsonPath, JSON.stringify(tripsData, null, 2))

  // Summary
  console.log(`\n${"=".repeat(50)}`)
  console.log("Done!")
  console.log(`${"=".repeat(50)}`)
  console.log(`\nTrip: ${tripName}`)
  console.log(`Photos: ${photos.length}`)
  console.log(`Categories: ${Array.from(allCategories).join(", ")}`)
  console.log(`\nGenerated entries in: src/data/trips.json`)
  console.log(`\nNext steps:`)
  console.log(`  1. Edit src/data/trips.json to:`)
  console.log(`     - Update Slovak translations (replace [SK] placeholders)`)
  console.log(`     - Refine English captions`)
  console.log(`     - Adjust categories if needed`)
  console.log(`     - Set featured: true if desired`)
  console.log(`  2. Commit and push to deploy`)
}

// Main execution
const args = process.argv.slice(2)
const tripName = args[0]
const country = args[1]
const date = args[2]

if (!tripName) {
  console.log("Add Trip Script - Automate photo processing")
  console.log("=".repeat(45))
  console.log("\nUsage: node scripts/add-trip.js [trip-name] [country] [date]")
  console.log("\nExample: node scripts/add-trip.js peru-2024 Peru 2024-06")
  console.log("\nThis will:")
  console.log("  1. Process images from /public/photos/peru-2024/originals/")
  console.log("  2. Apply watermarks and save to /public/photos/peru-2024/")
  console.log("  3. Generate trip entry in src/data/trips.json")
  console.log("\nPhoto naming tips:")
  console.log("  - Name photos descriptively: mountain-sunset.jpg, elephant.jpg")
  console.log("  - Categories are auto-detected from filenames")
  console.log("  - Keywords: mountain, city, animal, forest, temple, etc.")
  process.exit(0)
}

addTrip(tripName, country, date).catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
