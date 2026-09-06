import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  HardDrive, 
  WifiOff, 
  Trash2, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Lightbulb,
  FileSearch,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 flex flex-col items-center py-12 md:py-20 px-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs md:text-sm font-medium mb-6 border border-emerald-800/50 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Knowledge Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Privacy Is Not a Policy. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            It Is the Architecture.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
          Most websites make promises in fine print. PaperVault guarantees privacy mathematically by executing 100% of computations on your local device with zero backend servers.
        </p>
      </div>

      {/* 5 Core Pillars */}
      <section className="w-full mb-16">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>The Five Pillars of Client-Side Security</span>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: <HardDrive className="w-6 h-6 text-emerald-400" />,
              title: '1. Zero Server Infrastructure',
              desc: 'PaperVault has no backend server, no Express API, no SQL/NoSQL database, and no cloud file buckets. The application is a static React bundle distributed via Edge CDN. When you compress, merge, or convert a file, there is no server to receive it.',
            },
            {
              icon: <EyeOff className="w-6 h-6 text-cyan-400" />,
              title: '2. Zero Telemetry & Tracking',
              desc: 'We do not load Google Analytics, Meta Pixels, Mixpanel, Hotjar, or Sentry. We do not track document counts, file types, timestamps, or IP addresses. Your usage patterns are private and known only to you.',
            },
            {
              icon: <Lock className="w-6 h-6 text-blue-400" />,
              title: '3. Local Hardware Execution',
              desc: 'Heavy computations run in your computer’s RAM and CPU cores through multi-threaded Web Workers and WebAssembly. Processing speeds are bound only by your local hardware capabilities, completely bypassing cloud queues.',
            },
            {
              icon: <Trash2 className="w-6 h-6 text-rose-400" />,
              title: '4. Immediate Memory Hygiene',
              desc: 'Temporary preview objects use ephemeral Blob URLs (blob:https://...) which are revoked immediately upon unmounting via URL.revokeObjectURL(). Raw ArrayBuffers and ImageBitmaps are released into garbage collection as soon as jobs complete.',
            },
            {
              icon: <WifiOff className="w-6 h-6 text-purple-400" />,
              title: '5. Air-Gapped & Offline Capable',
              desc: 'Once the application bundle is cached in your browser, PaperVault works with zero network connectivity. You can disconnect Wi-Fi or unplug your Ethernet cable, and all 11 PDF and image tools will continue to execute seamlessly.',
            },
            {
              icon: <FileSearch className="w-6 h-6 text-amber-400" />,
              title: '6. Zero Metadata Retention',
              desc: 'File names, dimensions, page counts, and embedded EXIF or author strings are never transmitted. When using the Remove Metadata tool, sensitive tags are completely scrubbed at the byte level before saving.',
            },
          ].map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center shrink-0">
                  {pillar.icon}
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">{pillar.title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pl-1">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table: Cloud vs PaperVault */}
      <section className="w-full mb-16">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Security Comparison: Cloud Converters vs. PaperVault</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/50">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 font-semibold">
                <th className="p-4 sm:p-5">Security Vector</th>
                <th className="p-4 sm:p-5 text-rose-400">Traditional Online Services (iLovePDF, etc.)</th>
                <th className="p-4 sm:p-5 text-emerald-400 font-bold">PaperVault</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-white">File Transmission</td>
                <td className="p-4 sm:p-5 text-neutral-400">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Uploaded to remote AWS/GCP servers
                  </span>
                </td>
                <td className="p-4 sm:p-5 text-emerald-300 font-medium">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Never leaves your computer
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-white">Third-Party Disk Storage</td>
                <td className="p-4 sm:p-5 text-neutral-400">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Stored on remote hard drives for 1–24 hours
                  </span>
                </td>
                <td className="p-4 sm:p-5 text-emerald-300 font-medium">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Zero server storage (RAM only)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-white">Metadata & Document Leakage</td>
                <td className="p-4 sm:p-5 text-neutral-400">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Exposed to server access logs and telemetry
                  </span>
                </td>
                <td className="p-4 sm:p-5 text-emerald-300 font-medium">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Zero logs, zero collection
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-white">Tracking & Ad Networks</td>
                <td className="p-4 sm:p-5 text-neutral-400">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Google Analytics, AdSense, Facebook Pixels
                  </span>
                </td>
                <td className="p-4 sm:p-5 text-emerald-300 font-medium">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Zero trackers, zero analytics
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-white">Offline Functionality</td>
                <td className="p-4 sm:p-5 text-neutral-400">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Fails completely without internet
                  </span>
                </td>
                <td className="p-4 sm:p-5 text-emerald-300 font-medium">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Works 100% offline
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Privacy Facts & Trivia */}
      <section className="w-full mb-16">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Security Realities & Privacy Trivia</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>The "Deleted After 2 Hours" Illusion</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              When online converter sites say "files are deleted after 2 hours", your confidential bank statements, tax forms, or contracts still sit unencrypted on a shared cloud server for 7,200 seconds! Server crashes, automated backups, and disk swap files frequently preserve data long after the promised deletion window.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold">
              <Lightbulb className="w-4 h-4" />
              <span>Smartphones Embed Your GPS Coordinates</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Every photo snapped on an iPhone or Android phone contains hidden EXIF tags storing your exact GPS latitude, longitude, and altitude within 3 meters. Uploading raw photos to public forums or cloud tools inadvertently broadcasts your precise home address!
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
              <Lightbulb className="w-4 h-4" />
              <span>PDF "Ghost" Revisions</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Many corporate PDF editors implement "incremental updates", which append new edits to the end of the file rather than rewriting it. In 2011, a major government agency leaked classified redactions because the "blacked out" text was still present in the underlying object streams!
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Bandwidth Savings on Mobile Data</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Merging five 20MB PDFs on a traditional website requires uploading 100MB and downloading 100MB—consuming 200MB of cellular data. On PaperVault, the data transfer is exactly 0 MB because your local CPU does all the work!
            </p>
          </div>
        </div>
      </section>

      {/* How to Verify Us (30-Second Developer Audit) */}
      <section className="w-full p-8 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-blue-950/20 border border-neutral-800 mb-16">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Don’t Trust Us. Verify It Yourself in 30 Seconds.</h2>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mb-6 leading-relaxed">
          You don’t have to take our word for it. Any modern web browser includes inspection tools to verify network activity in real time:
        </p>

        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Open DevTools', desc: 'Press F12 or right-click anywhere and select Inspect.' },
            { step: '2', title: 'Network Tab', desc: 'Click on the Network tab and check the "Preserve Log" checkbox.' },
            { step: '3', title: 'Process a File', desc: 'Drop any PDF or photo into any tool and click process.' },
            { step: '4', title: 'Confirm 0 Bytes', desc: 'Observe that zero upload requests or data packets are sent.' },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col gap-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center mb-1">
                {item.step}
              </span>
              <span className="text-xs font-bold text-white">{item.title}</span>
              <span className="text-[11px] text-neutral-400 leading-relaxed">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA to Tools */}
      <div className="text-center">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-98 text-sm"
        >
          <span>Explore All 11 Tools & Architecture</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
