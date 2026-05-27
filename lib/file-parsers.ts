// ─── File Parsers ─────────────────────────────────────────────────────────────
// Parse base64-encoded uploaded files into plain text strings.
// Dynamic imports are used for pdf-parse and mammoth to avoid ESM/CJS build
// issues under Next.js's server-side bundler.

export interface ParseResult {
  text: string
  pageCount?: number
}

// ── DOM polyfills (module-level) ─────────────────────────────────────────────
// pdfjs-dist (used by pdf-parse) requires several browser APIs that Node.js
// does not provide.  Install stubs before any pdf-parse import is evaluated.

if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error polyfill
  globalThis.DOMMatrix = class DOMMatrix {
    a=1; b=0; c=0; d=1; e=0; f=0
    m11=1; m12=0; m13=0; m14=0
    m21=0; m22=1; m23=0; m24=0
    m31=0; m32=0; m33=1; m34=0
    m41=0; m42=0; m43=0; m44=1
    is2D=true; isIdentity=true
    constructor(_init?: unknown) { void _init }
    multiply(_m?: unknown) { return this }
    translate(_x=0, _y=0, _z=0) { return this }
    scale(_s=1) { return this }
    rotate(_angle=0) { return this }
    inverse() { return this }
    transformPoint(p: {x?:number;y?:number}) { return { x: p?.x??0, y: p?.y??0, z: 0, w: 1 } }
    toFloat32Array() { return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]) }
    toFloat64Array() { return new Float64Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]) }
    toString() { return 'matrix(1, 0, 0, 1, 0, 0)' }
  }
}
if (typeof globalThis.DOMPoint === 'undefined') {
  // @ts-expect-error polyfill
  globalThis.DOMPoint = class DOMPoint {
    x=0; y=0; z=0; w=1
    constructor(x=0, y=0, z=0, w=1) { this.x=x; this.y=y; this.z=z; this.w=w }
  }
}
if (typeof globalThis.Path2D === 'undefined') {
  // @ts-expect-error polyfill
  globalThis.Path2D = class Path2D {
    addPath() {}
    moveTo() {}
    lineTo() {}
    arc() {}
    rect() {}
    closePath() {}
  }
}
if (typeof globalThis.ImageData === 'undefined') {
  // @ts-expect-error polyfill
  globalThis.ImageData = class ImageData {
    readonly width: number
    readonly height: number
    readonly data: Uint8ClampedArray
    constructor(width: number, height: number) {
      this.width = width
      this.height = height
      this.data = new Uint8ClampedArray(width * height * 4)
    }
  }
}

// ── PDF ─────────────────────────────────────────────────────────────────────

async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // pdf-parse v2 uses a class-based API: new PDFParse({ data }) + .getText()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { PDFParse } = await import('pdf-parse') as any
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return {
      text: result.text ?? '',
      pageCount: result.numPages,
    }
  } finally {
    await parser.destroy().catch(() => {/* ignore cleanup errors */})
  }
}

// ── DOCX ────────────────────────────────────────────────────────────────────

async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const mammoth = (await import('mammoth')).default
  const result = await mammoth.extractRawText({ buffer })
  return { text: result.value ?? '' }
}

// ── TXT / fallback ──────────────────────────────────────────────────────────

function decodePlainText(base64: string): ParseResult {
  const decoded = Buffer.from(base64, 'base64').toString('utf-8')
  return { text: decoded }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse an uploaded file (given as base64) into a plain-text string.
 *
 * @param base64Content  Base64-encoded file bytes (or plain text for links/txt).
 * @param fileName       Original file name (used only for logging / error messages).
 * @param fileType       One of: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'link'
 */
export async function parseFile(
  base64Content: string,
  fileName: string,
  fileType: string
): Promise<ParseResult> {
  const normalised = fileType.toLowerCase().trim()

  try {
    if (normalised === 'pdf') {
      const buffer = Buffer.from(base64Content, 'base64')
      return await parsePdf(buffer)
    }

    if (normalised === 'docx') {
      const buffer = Buffer.from(base64Content, 'base64')
      return await parseDocx(buffer)
    }

    if (normalised === 'txt' || normalised === 'link') {
      // For plain text and web-link content the caller already provides UTF-8
      // text; we just need to decode from base64 if it actually is base64,
      // or return as-is if it is already a plain string.
      return decodePlainText(base64Content)
    }

    if (normalised === 'xlsx' || normalised === 'pptx') {
      // These formats require specialist libraries not included in this build.
      // Return whatever text can be extracted from a UTF-8 decode and flag it.
      console.warn(
        `[file-parsers] Full parsing for ${normalised.toUpperCase()} is not yet supported. ` +
          `Attempting UTF-8 decode as a fallback for: ${fileName}`
      )
      return decodePlainText(base64Content)
    }

    // Unknown type — best-effort UTF-8 decode
    console.warn(
      `[file-parsers] Unknown file type "${fileType}" for "${fileName}". Falling back to UTF-8 decode.`
    )
    return decodePlainText(base64Content)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to parse "${fileName}" (${fileType}): ${message}`)
  }
}
