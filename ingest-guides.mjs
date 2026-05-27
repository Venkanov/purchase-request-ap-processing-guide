// One-shot script: reads all guidance PDFs, extracts cover page text for version info,
// then ingests each file into the running app at http://localhost:3000

import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const files = [
  { path: '/Users/venkatesh/Desktop/KPMG leases-handbook.pdf',       name: 'KPMG Leases Handbook' },
  { path: '/Users/venkatesh/Desktop/ey Lease guide.pdf',             name: 'EY Lease Guide (ASC 842)' },
  { path: '/Users/venkatesh/Desktop/pwcleasesguide1224.pdf',         name: 'PwC Leases Guide (Dec 2024)' },
  { path: '/Users/venkatesh/Desktop/KPMG revenue-software-saas-1.pdf', name: 'KPMG Revenue – Software & SaaS' },
  { path: '/Users/venkatesh/Desktop/KPMG revenue-recognition.pdf',   name: 'KPMG Revenue Recognition Handbook' },
  { path: '/Users/venkatesh/Desktop/PwC Rev Rec Guide.pdf',          name: 'PwC Revenue Recognition Guide' },
  { path: '/Users/venkatesh/Desktop/ey Rev Rec Guide.pdf',           name: 'EY Revenue Recognition Guide' },
]

async function extractCoverText(buffer) {
  try {
    const pdfParse = require('pdf-parse')
    // Parse only the first 3 pages to keep it fast
    const result = await pdfParse(buffer, { max: 3 })
    return result.text.slice(0, 600).replace(/\s+/g, ' ').trim()
  } catch (e) {
    return '(could not extract cover text)'
  }
}

function detectVersion(coverText, fileName) {
  // Look for year patterns: 2020, 2021, 2022, 2023, 2024, 2025
  const yearMatch = coverText.match(/20(2[0-9])/g)
  const years = yearMatch ? [...new Set(yearMatch)].sort() : []
  const latestYear = years.length ? years[years.length - 1] : null

  // Look for edition keywords
  const editionMatch = coverText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d/i)
  const monthYear = editionMatch ? editionMatch[0] : null

  // Filename-based hints
  if (fileName.includes('1224') || fileName.includes('pwcleasesguide1224')) {
    return 'December 2024 edition'
  }

  if (monthYear) return monthYear
  if (latestYear) return `${latestYear} edition`
  return 'Edition unknown — verify currency before relying on this guide'
}

async function ingestFile(file) {
  const buffer = fs.readFileSync(file.path)
  const base64 = buffer.toString('base64')
  const coverText = await extractCoverText(buffer)
  const version = detectVersion(coverText, path.basename(file.path))

  console.log(`\n📄 ${file.name}`)
  console.log(`   Version : ${version}`)
  console.log(`   Cover   : ${coverText.slice(0, 120)}...`)
  console.log(`   Size    : ${(buffer.length / 1024 / 1024).toFixed(1)} MB`)

  const displayName = `${file.name} [${version}]`

  const res = await fetch('http://localhost:3000/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pool: 'guidance',
      fileName: displayName,
      fileType: 'pdf',
      content: base64,
    }),
  })

  const json = await res.json()
  if (res.ok) {
    console.log(`   ✅ Indexed — ${json.chunkCount} chunks (sourceId: ${json.sourceId})`)
  } else {
    console.log(`   ❌ Failed — ${json.error || JSON.stringify(json)}`)
  }

  return { name: displayName, version, ...json }
}

console.log('🚀 Ingesting guidance sources into Accounting Research Portal...\n')

const results = []
for (const file of files) {
  try {
    const result = await ingestFile(file)
    results.push(result)
  } catch (err) {
    console.log(`   ❌ Error processing ${file.name}: ${err.message}`)
  }
}

console.log('\n\n═══════════════════════════════════════════════════')
console.log('INGESTION SUMMARY')
console.log('═══════════════════════════════════════════════════')
for (const r of results) {
  const status = r.status === 'indexed' ? '✅' : '❌'
  console.log(`${status} ${r.name}`)
  if (r.chunkCount) console.log(`   ${r.chunkCount} chunks indexed`)
}
console.log('═══════════════════════════════════════════════════')
console.log('\n⚠️  Version notice added to each source name.')
console.log('   Verify guide currency against current FASB/IASB standards before use.')
