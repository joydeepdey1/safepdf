import { FileText, Image as ImageIcon, Shield, Zap, Lock, Folder, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const coreTools = [
  {
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into a single document instantly.',
    icon: <FileText className="w-6 h-6 text-blue-400" />,
    path: '/pdf/merge',
  },
  {
    title: 'Compress PDF',
    description: 'Reduce PDF file size for easier sharing and storage.',
    icon: <FileText className="w-6 h-6 text-blue-400" />,
    path: '/pdf/compress',
  },
  {
    title: 'Compress Image',
    description: 'Reduce image file size without losing quality.',
    icon: <ImageIcon className="w-6 h-6 text-emerald-400" />,
    path: '/image/compress',
  },
  {
    title: 'Resize Image',
    description: 'Change dimensions and scale images perfectly.',
    icon: <ImageIcon className="w-6 h-6 text-emerald-400" />,
    path: '/image/resize',
  },
];

const features = [
  {
    title: 'Zero Uploads',
    description: 'Your files never leave your device. All processing happens entirely inside your browser.',
    icon: <Shield className="w-8 h-8 text-blue-500" />,
  },
  {
    title: 'Lightning Fast',
    description: 'By bypassing server uploads, operations execute instantly using your devices raw power.',
    icon: <Zap className="w-8 h-8 text-amber-500" />,
  },
  {
    title: 'Total Privacy',
    description: 'No trackers, no analytics, no cookies. Your sensitive data remains completely confidential.',
    icon: <Lock className="w-8 h-8 text-emerald-500" />,
  },
  {
    title: 'Offline Capable',
    description: 'Once loaded, PaperVault works perfectly even when you disconnect from the internet.',
    icon: <Folder className="w-8 h-8 text-purple-500" />,
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center">

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-sm font-medium mb-8 border border-blue-800/50">
          <Shield className="w-4 h-4" />
          <span>100% Client-Side Processing</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          The Secure Toolkit for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            PDFs & Images
          </span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mb-12 leading-relaxed">
          A professional suite of tools to merge, split, compress, and edit your files.
          Fast, completely free, and your data never leaves your device.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#tools" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            Explore Tools <ArrowRight className="w-5 h-5" />
          </a>
          <a href="#privacy" className="inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-8 rounded-xl transition-all border border-neutral-700">
            Read our Privacy Promise
          </a>
        </div>
      </section>

      {/* Core Tools Section */}
      <section id="tools" className="w-full bg-neutral-950/50 border-y border-neutral-800 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Essential Tools</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Everything you need to manage your documents and media, with no artificial limits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreTools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.path}
                className="group flex flex-col p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-800/80 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{tool.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Promise & Features */}
      <section id="privacy" className="w-full max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Privacy is not a feature.<br/>It is the product.</h2>
            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
              Most online PDF tools upload your sensitive documents to their servers.
              They process them in the cloud, storing your personal data on machines you don't control.
            </p>
            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
              PaperVault uses modern WebAssembly and HTML5 Canvas to bring desktop-class
              processing directly into your browser. We couldn't look at your files even if we wanted to.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-3">
                {feature.icon}
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Placeholder */}
      <section className="w-full bg-neutral-950/50 border-t border-neutral-800 py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Frequently Asked Questions</h2>
          <div className="text-left space-y-6">
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-bold mb-2">Is it really free?</h3>
              <p className="text-neutral-400">Yes. Since you provide the computing power using your own device, our hosting costs are near zero, allowing us to offer this tool completely free.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-bold mb-2">Are there any file size limits?</h3>
              <p className="text-neutral-400">Only the limits of your device's memory. Because files aren't uploaded, you can process large documents instantly, provided your browser can handle them.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
