// CJS script — parses PDFs locally via pdf-parse, sends extracted text to
// the running app. This avoids binary size limits entirely.
'use strict'

const fs = require('fs')
const path = require('path')

const files = [
  { path: '/Users/venkatesh/Desktop/KPMG leases-handbook.pdf',         name: 'KPMG Leases Handbook' },
  { path: '/Users/venkatesh/Desktop/ey Lease guide.pdf',               name: 'EY Lease Guide (ASC 842)' },
  { path: '/Users/venkatesh/Desktop/pwcleasesguide1224.pdf',           name: 'PwC Leases Guide' },
  { path: '/Users/venkatesh/Desktop/KPMG revenue-software-saas-1.pdf', name: 'KPMG Revenue – Software & SaaS' },
  { path: '/Users/venkatesh/Desktop/KPMG revenue-recognition.pdf',     name: 'KPMG Revenue Recognition Handbook' },
  { path: '/Users/venkatesh/Desktop/PwC Rev Rec Guide.pdf',            name: 'PwC Revenue Recognition Guide' },
  { path: '/Users/venkatesh/Desktop/ey Rev Rec Guide.pdf',             name: 'EY Revenue Recognition Guide' },
]

// Known versions from filenames and publisher release patterns
const knownVersions = {
  'pwcleasesguide1224.pdf':           'PwC, December 2024',
  'KPMG leases-handbook.pdf':         'KPMG, Handbook Series',
  'ey Lease guide.pdf':               'EY, Technical Line',
  'KPMG revenue-software-saas-1.pdf': 'KPMG, Handbook Series',
  'KPMG revenue-recognition.pdf':     'KPMG, Handbook Series',
  'PwC Rev Rec Guide.pdf':            'PwC, Guide Series',
  'ey Rev Rec Guide.pdf':             'EY, Technical Line',
}

function detectVersion(coverText, fileName) {
  const base = path.basename(fileName)
  const known = knownVersions[base]

  // Try to pull a month+year from cover text
  const monthYear = coverText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d/i)
  if (monthYear) return `${known ? known + ' — ' : ''}${monthYear[0]}`

  const year = coverText.match(/20(2[0-9])/g)
  const latest = year ? [...new Set(year)].sort().pop() : null
  if (latest) return `${known ? known + ' — ' : ''}${latest}`

  return known || 'Version unknown — verify currency before use'
}

async function parsePdf(buffer) {
  // Require pdf-parse in CJS context — avoids ESM polyfill issues
  // Point directly at the lib file to skip the test-fixtures loading
  const pdfParse = require('./node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs')
  const result = await pdfParse(buffer)
  return { text: result.text || '', numpages: result.numpages }
}

async function ingestFile(file) {
  const fileSizeMB = (fs.statSync(file.path).size / 1024 / 1024).toFixed(1)
  console.log(`\n📄 ${file.name}  (${fileSizeMB} MB)`)

  // Parse PDF locally
  process.stdout.write('   Parsing PDF... ')
  const buffer = fs.readFileSync(file.path)
  const { text, numpages } = await parsePdf(buffer)
  console.log(`${numpages} pages, ${(text.length / 1000).toFixed(0)}k chars extracted`)

  // Extract version from first 800 chars of text
  const coverText = text.slice(0, 800).replace(/\s+/g, ' ').trim()
  const version = detectVersion(coverText, file.path)
  const displayName = `${file.name} [${version}]`

  console.log(`   Version : ${version}`)
  console.log(`   Sending to app...`)

  // Send extracted text (as base64 UTF-8) — much smaller than raw PDF binary
  const textBase64 = Buffer.from(text, 'utf-8').toString('base64')

  const res = await fetch('http://localhost:3000/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pool: 'guidance',
      fileName: displayName,
      fileType: 'txt',   // pre-parsed text — server will decode and chunk
      content: textBase64,
    }),
  })

  const responseText = await res.text()
  let json
  try { json = JSON.parse(responseText) } catch { json = { error: responseText.slice(0, 200) } }

  if (res.ok && json.status === 'indexed') {
    console.log(`   ✅ Indexed — ${json.chunkCount} chunks (sourceId: ${json.sourceId})`)
  } else {
    console.log(`   ❌ Failed (HTTP ${res.status}) — ${json.error || JSON.stringify(json)}`)
  }

  return { displayName, version, numpages, ...json }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Accounting Research Portal — Guidance Ingestion')
  console.log('  Source: Big 4 ASC 606 & ASC 842 Technical Guides')
  console.log('═══════════════════════════════════════════════════════')

  const results = []
  for (const file of files) {
    try {
      results.push(await ingestFile(file))
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
      results.push({ displayName: file.name, error: err.message })
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════')
  console.log('SUMMARY')
  console.log('═══════════════════════════════════════════════════════')
  for (const r of results) {
    const ok = r.status === 'indexed'
    console.log(`${ok ? '✅' : '❌'} ${r.displayName}`)
    if (ok) console.log(`   ${r.numpages} pages → ${r.chunkCount} chunks`)
    if (r.error) console.log(`   Error: ${r.error}`)
  }
  console.log('\n⚠️  CURRENCY NOTICE: Always verify these guides against')
  console.log('   current FASB ASC updates and KPMG/EY/PwC website for')
  console.log('   latest versions before relying on outputs in practice.')
}

main().catch(console.error)
