import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import WheelOfFortune from '../lib/WheelOfFortune';
import { MapPin, Mail, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WheelPage() {
    const [location, setLocation] = useState('Detecting...');
    const [email, setEmail] = useState('');
    const [result, setResult] = useState(null);
    const [preciseRequested, setPreciseRequested] = useState(false);

    useEffect(() => {
        // Phase 1: Silent IP Geolocation (Simulated for prototype)
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                setLocation(`${data.city}, ${data.country_name}`);
            })
            .catch(() => setLocation('Slovakia (Detecting...)'));
    }, []);

    const handleResult = (win) => {
        setResult(win);
        if (!win.label.includes('NO WIN')) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#059669', '#34d399']
            });
            setPreciseRequested(true);
        }
    };

    const requestPreciseLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    alert(`Presná poloha prijatá! Vaša odmena je platná pre oblasť: ${pos.coords.latitude}, ${pos.coords.longitude}`);
                },
                () => alert('Nepodarilo sa získať presnú polohu, nevadí!')
            );
        }
    };

    return (
        <div className="wheel-container font-sans text-white">
            <Head>
                <title>Zatoč a Vyhraj | E-shop Voucher</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <link rel="stylesheet" href="/styles/wheel.css" />
            </Head>

            <header className="flex flex-col items-center z-10">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                    <Sparkles size={24} />
                    <span className="font-bold tracking-widest text-sm uppercase">Exclusive Offer</span>
                </div>
                <h1 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200">
                    KOLESO ŠTASTIA
                </h1>
                <p className="text-gray-400 mt-2 text-sm flex items-center gap-1">
                    <MapPin size={14} /> Aktuálna zóna: {location}
                </p>
            </header>

            <main className="z-10 w-full flex flex-col items-center">
                <WheelOfFortune onResult={handleResult} />

                {result && (
                    <div className="mt-8 animate-bounce text-2xl font-bold text-center">
                        {result.label.includes('NO WIN')
                            ? '😢 Skús to nabudúce!'
                            : `🎉 VYHRAL SI: ${result.label}!`}
                    </div>
                )}
            </main>

            <footer className="w-full max-w-md z-20 mb-4 px-4">
                {preciseRequested ? (
                    <div className="glass-card text-center animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-lg font-bold mb-2">Chcete zvýšiť svoju výhru?</h3>
                        <p className="text-sm text-gray-300 mb-4">
                            Zdieľajte presnú polohu a odomknite <b>EXTRA 5% zľavu</b> v najbližšej predajni!
                        </p>
                        <button
                            onClick={requestPreciseLocation}
                            className="w-full py-3 bg-white text-emerald-900 font-bold rounded-xl active:scale-95 transition-transform"
                        >
                            POVLIŤ LOKÁCIU (+5%)
                        </button>
                    </div>
                ) : (
                    <div className="glass-card">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="email"
                                placeholder="Váš e-mail pre zaslanie výhry"
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-white"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-3 text-center uppercase tracking-tighter">
                            Zatočením súhlasíte so spracovaním údajov pre marketingové účely.
                        </p>
                    </div>
                )}
            </footer>

            {/* Background blobs */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] z-0" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] z-0" />
        </div>
    );
}
