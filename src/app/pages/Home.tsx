import { useState } from 'react';
import { 
  FileText, 
  Shield, 
  Zap, 
  Lock, 
  Folder, 
  ArrowRight,
  Scissors,
  RotateCw,
  Trash2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  FileImage,
  Crop
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ToolCategory = 'all' | 'pdf' | 'image';

interface ToolItem {
  title: string;
  description: string;
  category: 'pdf' | 'image';
  icon: React.ReactNode;
  path: string;
  badge: string;
}

const allTools: ToolItem[] = [
  // PDF Tools
  {
    title: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file in seconds.',
    category: 'pdf',
    icon: <Layers className="w-6 h-6 text-blue-400" />,
    path: '/pdf/merge',
    badge: 'PDF',
  },
  {
    title: 'Split PDF',
    description: 'Extract specific pages or custom page ranges into a standalone PDF.',
    category: 'pdf',
    icon: <Scissors className="w-6 h-6 text-indigo-400" />,
    path: '/pdf/split',
    badge: 'PDF',
  },
  {
    title: 'Rotate PDF',
    description: 'Permanently rotate PDF orientation by 90°, 180°, or 270° degrees.',
    category: 'pdf',
    icon: <RotateCw className="w-6 h-6 text-sky-400" />,
    path: '/pdf/rotate',
    badge: 'PDF',
  },
  {
    title: 'Delete Pages',
    description: 'Remove unwanted pages or page intervals from your PDF files.',
    category: 'pdf',
    icon: <Trash2 className="w-6 h-6 text-rose-400" />,
    path: '/pdf/delete-pages',
    badge: 'PDF',
  },
  {
    title: 'Images to PDF',
    description: 'Transform collections of PNG, JPG, and WebP photos into a clean PDF.',
    category: 'pdf',
    icon: <FileText className="w-6 h-6 text-violet-400" />,
    path: '/pdf/images-to-pdf',
    badge: 'PDF',
  },
  {
    title: 'PDF to Images',
    description: 'Convert each page of your PDF into high-resolution PNG or JPEG images.',
    category: 'pdf',
    icon: <FileImage className="w-6 h-6 text-fuchsia-400" />,
    path: '/pdf/pdf-to-images',
    badge: 'PDF',
  },
  {
    title: 'Compress PDF',
    description: 'Reduce PDF document file size with smart quality and downsampling presets.',
    category: 'pdf',
    icon: <Minimize2 className="w-6 h-6 text-amber-400" />,
    path: '/pdf/compress',
    badge: 'PDF',
  },

  // Image Tools
  {
    title: 'Compress Image',
    description: 'Optimize image file size with fine-tuned quality control and instant preview.',
    category: 'image',
    icon: <Minimize2 className="w-6 h-6 text-emerald-400" />,
    path: '/image/compress',
    badge: 'Image',
  },
  {
    title: 'Resize Image',
    description: 'Change pixel dimensions or percentage scale while preserving aspect ratio.',
    category: 'image',
    icon: <Maximize2 className="w-6 h-6 text-teal-400" />,
    path: '/image/resize',
    badge: 'Image',
  },
  {
    title: 'Convert Image',
    description: 'Effortlessly switch image formats between PNG, JPEG, and WebP offline.',
    category: 'image',
    icon: <RefreshCw className="w-6 h-6 text-cyan-400" />,
    path: '/image/convert',
    badge: 'Image',
  },
  {
    title: 'Crop Image',
    description: 'Trim photos and graphics with aspect ratio presets or custom freeform selections.',
    category: 'image',
    icon: <Crop className="w-6 h-6 text-sky-400" />,
    path: '/image/crop',
    badge: 'Image',
  },
];

const features = [
  {
    title: 'Zero Uploads',
    description: 'Your files never leave your device. All processing happens entirely inside your browser sandbox.',
    icon: <Shield className="w-8 h-8 text-blue-500" />,
  },
  {
    title: 'Lightning Fast',
    description: 'Bypass server queues. Operations run at hardware speeds using multithreaded Web Workers.',
    icon: <Zap className="w-8 h-8 text-amber-500" />,
  },
  {
    title: 'Total Privacy',
    description: 'No telemetry, no tracking, no analytics. Your confidential documents stay 100% private.',
    icon: <Lock className="w-8 h-8 text-emerald-500" />,
  },
  {
    title: 'Offline Capable',
    description: 'Once loaded, PaperVault continues to function flawlessly even without an internet connection.',
    icon: <Folder className="w-8 h-8 text-purple-500" />,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<ToolCategory>('all');

  const filteredTools = allTools.filter(
    (tool) => activeTab === 'all' || tool.category === activeTab
  );

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-20 md:py-28 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs md:text-sm font-medium mb-8 border border-blue-800/50 shadow-sm">
          <Shield className="w-4 h-4" />
          <span>100% Client-Side Private Processing</span>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          The Secure Toolkit for <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
            PDFs & Images
          </span>
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed font-normal">
          A high-performance suite to merge, split, rotate, resize, compress, and convert your documents. 
          Zero cloud uploads, zero tracking, and completely free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <a 
            href="#tools" 
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] active:scale-98"
          >
            Explore All Tools <ArrowRight className="w-4 h-4" />
          </a>
          <a 
            href="#privacy" 
            className="inline-flex items-center justify-center gap-2 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 font-medium py-3 px-8 rounded-xl transition-all border border-neutral-700/80 active:scale-98"
          >
            Privacy Promise
          </a>
        </div>
      </section>

      {/* Complete Tools Section */}
      <section id="tools" className="w-full bg-neutral-950/60 border-y border-neutral-800/80 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">All Tools</h2>
            <p className="text-neutral-400 max-w-xl mx-auto text-base">
              Client-side utilities designed for privacy, speed, and clean typography.
            </p>

            {/* Filter Tabs */}
            <div className="inline-flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl mt-8">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Tools ({allTools.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'pdf'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                PDF Tools ({allTools.filter((t) => t.category === 'pdf').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'image'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Image Tools ({allTools.filter((t) => t.category === 'image').length})
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.path}
                className="group flex flex-col p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 hover:border-blue-500/50 hover:bg-neutral-800/70 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-500/5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {tool.icon}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                      tool.category === 'pdf'
                        ? 'bg-blue-950/40 text-blue-400 border-blue-800/40'
                        : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed flex-1">
                  {tool.description}
                </p>
                <div className="mt-4 pt-4 border-t border-neutral-800/60 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-white transition-colors">
                  <span>Launch tool</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Promise & Features */}
      <section id="privacy" className="w-full max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
              <Lock className="w-3.5 h-3.5" />
              <span>Architectural Privacy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight text-white">
              Privacy is not an add-on.<br />It is the fundamental product.
            </h2>
            <p className="text-base text-neutral-400 mb-6 leading-relaxed">
              Traditional online PDF and image converters upload your confidential documents to unknown cloud servers,
              retaining files on storage buckets beyond your visibility.
            </p>
            <p className="text-base text-neutral-400 mb-8 leading-relaxed">
              PaperVault was engineered from day one to operate exclusively within your web browser using HTML5 Canvas,
              Web Workers, and client-side binary parsing. Your files never touch a remote network connection.
            </p>
            <div className="flex items-center gap-6 text-sm text-neutral-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Zero Server Uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Zero Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Zero Cookies</span>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-base font-bold text-white mb-1.5">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full bg-neutral-950/60 border-t border-neutral-800/80 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center text-white tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-semibold text-white mb-2">How can you guarantee my files are not uploaded?</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                PaperVault is built as a static application with zero backend endpoints. You can open your browser's Developer Tools Network tab during any operation to confirm that no file payloads are ever transmitted over the network.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-semibold text-white mb-2">Can PaperVault work offline?</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Yes. Once the initial application assets are loaded by your browser, all processing algorithms run client-side inside Web Workers on your local machine.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-semibold text-white mb-2">Are there any file size or conversion limits?</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Because operations execute in your device's memory, limits depend on your computer's RAM and browser capabilities rather than arbitrary subscription gates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
