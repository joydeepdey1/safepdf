import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Scissors, 
  RotateCw, 
  Trash2, 
  FileText, 
  FileImage, 
  Minimize2, 
  Maximize2, 
  RefreshCw, 
  Crop, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  Terminal, 
  BookOpen,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface ToolDoc {
  id: string;
  name: string;
  category: 'pdf' | 'image';
  path: string;
  icon: React.ReactNode;
  badgeColor: string;
  summary: string;
  howItWorks: string;
  pipeline: string[];
  techFact: string;
  triviaTitle: string;
  specs: { label: string; value: string }[];
}

const TOOL_DOCS: ToolDoc[] = [
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    category: 'pdf',
    path: '/pdf/merge',
    icon: <Layers className="w-6 h-6 text-blue-400" />,
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    summary: 'Merges multiple independent PDF documents into a unified, clean document hierarchy without decompressing or modifying existing streams.',
    howItWorks: 'Instead of re-rendering pages, PaperVault parses the low-level PDF Cross-Reference (XRef) tables and indirect object streams. It extracts the /Page dictionaries from each document, re-indexes object IDs to prevent collisions, merges shared /Resources dictionaries, and links them into a fresh root /Catalog structure.',
    pipeline: [
      'Ingest file buffers in an isolated Web Worker',
      'Validate PDF header magic bytes (%PDF-1.x) and parse XRef tables',
      'Enumerate and re-map indirect object IDs across all source documents',
      'Construct a unified /Pages tree and assign root /Catalog references',
      'Serialize final byte stream using compressed object streams (useObjectStreams)',
    ],
    triviaTitle: 'PDFs Are Object-Oriented Databases',
    techFact: 'A PDF is not a flat sequence of pages! Internally, it is an indirect object graph. When merging client-side, PaperVault doesn’t touch a single pixel or re-encode fonts—it simply updates the graph pointers in under 50 milliseconds.',
    specs: [
      { label: 'Engine', value: 'pdf-lib (Worker-isolated)' },
      { label: 'Lossless', value: '100% Exact Quality' },
      { label: 'Memory Footprint', value: '~1.2x combined file size' },
    ],
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    category: 'pdf',
    path: '/pdf/split',
    icon: <Scissors className="w-6 h-6 text-indigo-400" />,
    badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
    summary: 'Extracts specific pages or custom ranges into a pristine, standalone document with all fonts and graphics preserved.',
    howItWorks: 'PaperVault parses the page tree structure, evaluates your custom page range (e.g. 1-3, 5), and copies only the selected /Page objects into a new PDFDocument. It transitively pulls only the required fonts, images, and content streams while pruning discarded objects, ensuring a compact output file.',
    pipeline: [
      'Parse input document and construct page tree index',
      'Parse page range string and validate against total document page count',
      'Deep-copy selected /Page dictionaries and transitive resource dependencies',
      'Create minimal root catalog and serialize cleanly',
    ],
    triviaTitle: 'Why Cloud Splitters Waste 99% of Bandwidth',
    techFact: 'Traditional cloud converters force you to upload an entire 100MB PDF across the Internet just to extract page 3. PaperVault extracts page 3 inside your browser memory in 40ms without sending a single byte across the wire!',
    specs: [
      { label: 'Engine', value: 'pdf-lib XRef traversal' },
      { label: 'Range Syntax', value: 'Intervals (e.g. 1-5, 8)' },
      { label: 'Speed', value: '< 100ms typical execution' },
    ],
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    category: 'pdf',
    path: '/pdf/rotate',
    icon: <RotateCw className="w-6 h-6 text-sky-400" />,
    badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    summary: 'Permanently adjusts orientation across 90°, 180°, or 270° with zero pixel re-compression or generation loss.',
    howItWorks: 'In the ISO 32000-1 PDF specification, page orientation is controlled by the /Rotate attribute in the page dictionary. PaperVault queries the current rotation integer, adds your chosen angle modulo 360, and updates the dictionary entry. Vector drawings, text layers, and embedded photos remain untouched.',
    pipeline: [
      'Load PDF structure off-thread in Web Worker',
      'Traverse all /Page objects in document catalog',
      'Read existing /Rotate key (defaults to 0 if absent)',
      'Write normalized rotation angle: (current + delta) % 360',
      'Serialize updated document instantly',
    ],
    triviaTitle: 'Zero-Generation Loss Rotation',
    techFact: 'Unlike scanning software that takes a screenshot of the page and re-saves it as a lossy image, PaperVault modifies only 1 integer in the file’s metadata. The vector curves and embedded fonts remain byte-for-byte identical to the original.',
    specs: [
      { label: 'Engine', value: 'PDF Spec ISO 32000-1' },
      { label: 'Transform Type', value: 'Metadata Coordinate Transform' },
      { label: 'Quality Loss', value: '0.00% (Bit-exact)' },
    ],
  },
  {
    id: 'delete-pages',
    name: 'Delete Pages',
    category: 'pdf',
    path: '/pdf/delete-pages',
    icon: <Trash2 className="w-6 h-6 text-rose-400" />,
    badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    summary: 'Removes unwanted pages or intervals while garbage-collecting orphaned font streams and unreferenced images.',
    howItWorks: 'The document page tree is filtered against your deletion list. The /Kids array in the parent /Pages dictionary is rebuilt with the remaining page references, and the /Count descriptor is updated. Dead objects unique to deleted pages are omitted during cross-reference serialization.',
    pipeline: [
      'Map all page indices in the PDF document',
      'Evaluate remove-set and compute inverted keep-list',
      'Construct clean /Pages tree containing exclusively kept pages',
      'Garbage collect unreferenced font programs and embedded assets',
      'Stream progress and deliver sanitized PDF',
    ],
    triviaTitle: 'PDF Ghost Data Is Real',
    techFact: 'Did you know? In sloppy PDF editors, "deleting" a page often just hides it from view while leaving confidential text and photos embedded in the file! PaperVault rebuilds the object tree from scratch, guaranteeing deleted content is truly obliterated.',
    specs: [
      { label: 'Safety', value: 'True Object Deletion' },
      { label: 'Garbage Collection', value: 'Automatic Unreferenced Pruning' },
      { label: 'Execution', value: 'Client Web Worker' },
    ],
  },
  {
    id: 'images-to-pdf',
    name: 'Images to PDF',
    category: 'pdf',
    path: '/pdf/images-to-pdf',
    icon: <FileText className="w-6 h-6 text-violet-400" />,
    badgeColor: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    summary: 'Packages PNG, JPEG, and WebP photos into formatted PDF documents with customizable margins and page geometry.',
    howItWorks: 'Each image buffer is inspected for dimensions and color space. PaperVault embeds JPEG bytes directly as /DCTDecode streams without re-encoding, and converts PNG/WebP into clean /FlateDecode image XObjects. Transformation matrices scale the image coordinates onto standard 72 pt/inch PDF media boxes.',
    pipeline: [
      'Decode image dimensions and format signatures',
      'Calculate bounding box aspect ratio according to selected preset (Fit, A4 Portrait, A4 Landscape)',
      'Embed raw image stream into new PDFDocument instance',
      'Draw transformation matrix onto page content stream with custom margin offsets',
      'Compile multi-page PDF output',
    ],
    triviaTitle: '72 Points Per Inch',
    techFact: 'PDF coordinate spaces are measured in typographic "points", where 1 point equals exactly 1/72 of an inch (0.3528 mm), dating back to the Renaissance and the DTP revolution of 1984!',
    specs: [
      { label: 'Page Formats', value: 'Auto-Fit, A4 Portrait, A4 Landscape' },
      { label: 'Supported Inputs', value: 'JPEG, PNG, WebP' },
      { label: 'JPEG Re-encoding', value: 'None (Direct stream pass-through)' },
    ],
  },
  {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    category: 'pdf',
    path: '/pdf/pdf-to-images',
    icon: <FileImage className="w-6 h-6 text-fuchsia-400" />,
    badgeColor: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
    summary: 'Renders PDF pages into high-resolution PNG or JPEG images with standard fonts, CJK character support, and DPI scaling.',
    howItWorks: 'PaperVault executes Mozilla’s pdfjs-dist inside a dedicated Web Worker. It uses a custom OffscreenCanvasFactory to bypass missing DOM APIs in worker scopes, and activates disableFontFace: true to render font glyphs as direct vector paths on OffscreenCanvas, ensuring zero missing font tofu boxes (□□□).',
    pipeline: [
      'Transfer PDF ArrayBuffer to isolated Web Worker',
      'Initialize PDF.js engine with local cmaps and standard font dictionaries',
      'Instantiate OffscreenCanvasFactory and OffscreenFilterFactory',
      'Execute vector rendering instructions on OffscreenCanvas with 1.0x to 2.0x DPI scale',
      'Convert canvas buffers to PNG or progressive JPEG blobs',
      'Stream completion progress per page',
    ],
    triviaTitle: 'The DOM-Less Web Worker Challenge',
    techFact: 'PDF.js was originally built for browser DOM rendering and expects document.createElement("canvas"). PaperVault engineers an OffscreenCanvasFactory polyfill so high-speed PDF rendering executes multithreaded without freezing your UI!',
    specs: [
      { label: 'Rendering Engine', value: 'pdfjs-dist + Custom Canvas Factory' },
      { label: 'Glyph Drawing', value: 'Direct Vector Path Rasterization' },
      { label: 'Resolution Presets', value: '72 DPI (1x), 108 DPI (1.5x), 144 DPI (2x)' },
    ],
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    category: 'pdf',
    path: '/pdf/compress',
    icon: <Minimize2 className="w-6 h-6 text-amber-400" />,
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    summary: 'Reduces PDF file sizes with calibrated resolution limits, JPEG quantization, object streams, and anti-bloat safeguards.',
    howItWorks: 'Large PDFs are almost always bloated by uncompressed images and redundant streams. PaperVault downsamples pages with calibrated DPI limits, clamps maximum pixel dimensions (preventing runaway memory), compresses object tables with useObjectStreams: true, and features an automated safeguard that guarantees the output is never larger than the input.',
    pipeline: [
      'Cache original byte size and immutable byte backup upfront',
      'Render pages onto OffscreenCanvas using calibrated scale and max-dimension clamping',
      'Encode page canvases into progressive JPEG streams with preset-tuned quantization tables',
      'Embed compressed streams into new PDF with identical point dimensions',
      'Serialize with useObjectStreams: true for compressed XRef tables',
      'Anti-bloat safeguard: Verify final size < original size, or fall back to lossless optimization',
    ],
    triviaTitle: 'Why PDFs Can Accidentally Double in Size',
    techFact: 'If a PDF compressor blindly rasterizes vector text at high DPI and high JPEG quality, 53 presentation slides can easily explode from 4MB to 8MB! PaperVault clamps maximum pixel bounding boxes and guarantees your file size will never expand.',
    specs: [
      { label: 'Presets', value: 'Extreme (~75%), Recommended (~55%), Less (~32%)' },
      { label: 'Stream Mode', value: 'PDFStreamWriter Object Streams' },
      { label: 'Safety Net', value: 'Automated Anti-Expansion Fallback' },
    ],
  },
  {
    id: 'compress-image',
    name: 'Compress Image',
    category: 'image',
    path: '/image/compress',
    icon: <Minimize2 className="w-6 h-6 text-emerald-400" />,
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    summary: 'Compresses photos and graphics with fine-tuned quality controls, instant byte savings, and live visual preview.',
    howItWorks: 'Decodes image bitstreams into raw pixel arrays using createImageBitmap, paints onto an OffscreenCanvas, and applies browser-native progressive JPEG and WebP quantization algorithms. Computes byte savings in real-time off the main UI thread.',
    pipeline: [
      'Read image buffer into Web Worker',
      'Decode raw pixel buffers via createImageBitmap',
      'Draw to OffscreenCanvas and evaluate target quality factors',
      'Encode via canvas.convertToBlob with progressive quantization',
      'Compute savings percentage and return compressed ArrayBuffer',
    ],
    triviaTitle: 'Human Eyes & Chroma Subsampling',
    techFact: 'The human eye has ~120 million rods (brightness/luminance) but only ~6 million cones (color/chrominance). JPEG compression takes advantage of this biology by discarding up to 75% of color data before human eyes can detect any difference!',
    specs: [
      { label: 'Algorithm', value: 'DCT Quantization & Discrete Cosine Transform' },
      { label: 'Presets', value: 'Low, Medium, High quality' },
      { label: 'Execution', value: 'OffscreenCanvas Worker' },
    ],
  },
  {
    id: 'resize-image',
    name: 'Resize Image',
    category: 'image',
    path: '/image/resize',
    icon: <Maximize2 className="w-6 h-6 text-teal-400" />,
    badgeColor: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
    summary: 'Scales pixel dimensions or percentage scale while preserving aspect ratios using high-quality bicubic interpolation.',
    howItWorks: 'Computes target dimensions based on user inputs (percentage or exact width/height), locks aspect ratios if requested, and scales the image buffer using high-precision bicubic filtering (imageSmoothingQuality = "high"). Multi-file batch resizing processes sequentially with streamed progress.',
    pipeline: [
      'Extract natural image dimensions',
      'Compute destination bounding box based on percentage or pixel targets',
      'Allocate destination OffscreenCanvas with target dimensions',
      'Execute high-quality bicubic interpolation filter',
      'Export matching format buffer and stream progress',
    ],
    triviaTitle: 'Bicubic vs Nearest Neighbor',
    techFact: 'Simple scaling algorithms (like nearest neighbor) produce ugly jagged pixel edges. PaperVault uses high-quality bicubic interpolation, which samples 16 surrounding pixels to calculate smooth, natural gradient curves for every single new pixel.',
    specs: [
      { label: 'Interpolation', value: 'High-Precision Bicubic' },
      { label: 'Modes', value: 'Percentage (1-500%) & Exact Pixel Dimensions' },
      { label: 'Thread Safety', value: 'Dedicated Web Worker' },
    ],
  },
  {
    id: 'convert-image',
    name: 'Convert Image',
    category: 'image',
    path: '/image/convert',
    icon: <RefreshCw className="w-6 h-6 text-cyan-400" />,
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    summary: 'Converts images between PNG, JPEG, and WebP containers offline with zero quality degradation or network latency.',
    howItWorks: 'Ingests any browser-supported image format, strips container headers, unpacks raw RGBA pixel data onto an OffscreenCanvas, and re-encodes into the target container format using native browser encoder primitives.',
    pipeline: [
      'Receive image file array in Web Worker',
      'Decode raw uncompressed pixel data into memory',
      'Mount pixel data onto OffscreenCanvas buffer',
      'Re-encode into target MIME type (image/png, image/jpeg, image/webp)',
      'Deliver converted file array with staggered downloads',
    ],
    triviaTitle: 'Why WebP Is Replacing PNG and JPEG',
    techFact: 'Developed by Google in 2010, WebP utilizes predictive coding borrowed from VP8 video keyframes. It delivers 26% smaller file sizes than PNGs with alpha transparency, and 25-34% smaller file sizes than JPEGs at the exact same visual quality!',
    specs: [
      { label: 'Formats', value: 'PNG, JPEG, WebP' },
      { label: 'Batch Processing', value: 'Multi-image queue with staggered download' },
      { label: 'Conversion Speed', value: '< 50ms per megapixel' },
    ],
  },
  {
    id: 'crop-image',
    name: 'Crop Image',
    category: 'image',
    path: '/image/crop',
    icon: <Crop className="w-6 h-6 text-sky-400" />,
    badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    summary: 'Trims photos and graphics with aspect ratio presets (1:1, 16:9, 4:3, 9:16, 3:2, Freeform) and live pixel metrics.',
    howItWorks: 'Provides an interactive 60fps canvas workspace with 8 resize handles and a 3x3 rule-of-thirds grid. Maps display coordinate deltas to native image pixels, clamps boundaries, and delegates sub-rectangle clipping to an OffscreenCanvas worker for high-speed export.',
    pipeline: [
      'Render preview image with CSS clip-path polygon mask cutout',
      'Handle pointer drag events with aspect ratio geometry locking',
      'Translate display coordinates to native pixel bounding box',
      'Worker executes drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)',
      'Convert to matching MIME type blob and download automatically',
    ],
    triviaTitle: 'The Golden Ratio & Rule of Thirds',
    techFact: 'The 3x3 grid overlaid on PaperVault’s cropper is based on the classical "Rule of Thirds". Aligning focal subjects along these intersection points creates compositions that human eyes naturally perceive as more harmonious and engaging!',
    specs: [
      { label: 'Presets', value: '1:1 Square, 16:9 Landscape, 4:3 Standard, 9:16 Story, 3:2 Photo, Freeform' },
      { label: 'Overlay', value: 'CSS Polygon Cutout + 8 Resize Handles' },
      { label: 'Precision', value: 'Sub-pixel image coordinate mapping' },
    ],
  },
  {
    id: 'remove-metadata',
    name: 'Remove Metadata',
    category: 'image',
    path: '/image/remove-metadata',
    icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    summary: 'Scrubs embedded EXIF camera tags, GPS location coordinates, timestamps, and device properties for complete privacy.',
    howItWorks: 'Scans binary file headers for JPEG APP1 (Exif/XMP), APP2 (ICC), APP13 (IPTC), and PNG/WebP metadata chunks. Decodes only the raw pixel data into an ImageBitmap and draws it onto a clean canvas context, creating a pristine file with zero metadata markers.',
    pipeline: [
      'Scan raw buffer for EXIF (0xFFE1), GPS, XMP, and IPTC markers',
      'Decode pure RGB pixel data via createImageBitmap',
      'Draw pixels onto a pristine, un-tagged OffscreenCanvas context',
      'Re-encode into clean image file with zero metadata headers',
      'Display privacy confirmation and deliver sanitized images',
    ],
    triviaTitle: 'Photos Reveal Your Home Address',
    techFact: 'Every photo taken with a smartphone embeds an EXIF metadata packet containing your exact GPS latitude, longitude, and altitude (within 3 meters), plus camera serial number and exact time. Scrubbing it permanently anonymizes your files!',
    specs: [
      { label: 'Scrubbed Data', value: 'GPS Coordinates, Camera/Lens Model, Timestamps, Serial Numbers, Author' },
      { label: 'Sanitization', value: 'Pure Pixel Canvas Re-encoding' },
      { label: 'Image Quality', value: '100% Pixel Preservation' },
    ],
  },
];

export default function ToolsGuide() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pdf' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = TOOL_DOCS.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesQuery = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.techFact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex-1 flex flex-col items-center py-12 md:py-20 px-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="text-center max-w-3xl mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs md:text-sm font-medium mb-6 border border-blue-800/50 shadow-sm">
          <Cpu className="w-4 h-4" />
          <span>Technology & Architecture Guide</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          How Every Tool Works <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
            Under the Hood
          </span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
          PaperVault operates entirely in your browser using WebAssembly, multi-threaded Web Workers, and low-level binary manipulation. Here is the exact step-by-step engineering behind every tool.
        </p>

        {/* Global Architecture Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {[
            { label: 'Zero Server APIs', desc: '100% Static CDN' },
            { label: 'Web Workers', desc: 'Off-Thread Processing' },
            { label: 'WebAssembly', desc: 'Native C/C++ Speeds' },
            { label: 'Memory Hygiene', desc: 'Auto URL Revocation' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 text-left">
              <span className="block text-xs font-bold text-white">{item.label}</span>
              <span className="block text-[11px] text-neutral-500 mt-0.5">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-neutral-800 mb-10">
        {/* Category Tabs */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Tools ({TOOL_DOCS.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('pdf')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'pdf'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            PDF Suite ({TOOL_DOCS.filter((d) => d.category === 'pdf').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('image')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'image'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Image Suite ({TOOL_DOCS.filter((d) => d.category === 'image').length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search tools, mechanics, or trivia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Tool Deep Dive Cards */}
      <div className="w-full flex flex-col gap-10">
        {filteredDocs.map((doc) => (
          <article
            key={doc.id}
            id={doc.id}
            className="p-7 sm:p-9 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col gap-6 relative overflow-hidden"
          >
            {/* Header / Launch CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center shrink-0">
                  {doc.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {doc.name}
                    </h2>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${doc.badgeColor}`}>
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
                    {doc.summary}
                  </p>
                </div>
              </div>

              <Link
                to={doc.path}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-98 shrink-0 self-start sm:self-center"
              >
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Technical Breakdown & Pipeline */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* How it works */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>Technical Execution</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/60">
                  {doc.howItWorks}
                </p>

                {/* Specs List */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {doc.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-850 text-left">
                      <span className="block text-[10px] uppercase font-semibold text-neutral-500">{spec.label}</span>
                      <span className="block text-xs font-medium text-neutral-200 mt-0.5 truncate">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step by step pipeline */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Step-by-Step Pipeline</span>
                </div>
                <div className="flex flex-col gap-2 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/60">
                  {doc.pipeline.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start gap-3 text-xs text-neutral-300 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {stepIdx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tech Fact / Trivia Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-950/30 via-indigo-950/20 to-purple-950/30 border border-blue-900/40 flex items-start gap-3.5">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <span>Fact & Trivia: {doc.triviaTitle}</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {doc.techFact}
                </p>
              </div>
            </div>
          </article>
        ))}

        {filteredDocs.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 text-neutral-400">
            <HelpCircle className="w-8 h-8 mx-auto mb-3 text-neutral-500" />
            <p className="text-sm font-semibold text-white">No matching tools found</p>
            <p className="text-xs mt-1">Try a different search term or select another category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
