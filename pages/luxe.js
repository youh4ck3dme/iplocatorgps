import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Mail, ArrowRight, CheckCircle, MapPin, Sparkles, Menu, Search, ShoppingCart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LuxePage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [location, setLocation] = useState('Detecting...');
    const [time, setTime] = useState('21:05');

    useEffect(() => {
        // Phase 1: Silent IP detection
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => setLocation(`${data.city}, ${data.country_name}`))
            .catch(() => setLocation('Slovakia (Global)'));

        // Simulated Clock
        const timer = setInterval(() => {
            const now = new Date();
            setTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;

        // Trigger precise GPS as per blueprint
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(() => {
                console.log("GPS received for contest entry");
            }, () => { });
        }

        confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#ff8c00', '#f59e0b', '#ffffff', '#e2c08d']
        });

        setSubmitted(true);
    };

    return (
        <div className="luxe-container font-sans">
            <Head>
                <title>LUXE Boutique | Vyhraj 500€ Voucher</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <link rel="stylesheet" href="/styles/luxe.css" />
            </Head>

            <div className="luxe-status-bar">
                <span>{time}</span>
                <div className="flex gap-2">
                    <span>📶</span> <span>🔋</span>
                </div>
            </div>

            <header className="w-full flex justify-between items-center py-4 z-10">
                <Menu size={24} className="text-white" />
                <div className="luxe-logo">
                    <div className="text-xl leading-none">Luxe</div>
                    <div className="text-[8px] tracking-[0.4em] mt-1 opacity-80">Boutique</div>
                </div>
                <div className="flex gap-4">
                    <Search size={22} className="text-white opacity-80" />
                    <ShoppingCart size={22} className="text-white opacity-80" />
                </div>
            </header>

            <div className="luxe-orb" />

            <main className="flex-1 flex flex-col items-center justify-center z-10 w-full">
                <motion.div
                    animate={{
                        y: [0, -15, 0],
                        rotateZ: [0, 2, -2, 0]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="mb-8 relative"
                >
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                    <div className="w-48 h-48 bg-[#034f3e] border-2 border-[#e2c08d] rounded-2xl flex flex-col items-center justify-center p-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#e2c08d]/20" />
                        <div className="absolute -top-6 w-12 h-12 border-4 border-[#e2c08d] rounded-full" />
                        <div className="text-[#e2c08d] text-[10px] tracking-widest uppercase mb-2">Mystery</div>
                        <Gift size={50} className="text-[#e2c08d]" />
                        <div className="text-[#e2c08d] text-[10px] tracking-widest uppercase mt-2">Gift Box</div>
                    </div>
                    <Sparkles className="absolute -top-4 -right-4 text-[#ff8c00] animate-pulse" />
                </motion.div>

                <section className="px-4 mb-8">
                    <h1 className="luxe-heading">Vyhraj voucher za 500€</h1>
                    <p className="text-[#a0b0ab] text-sm px-6">
                        Prihlás sa a získaj prístup k exkluzívnym ponukám, novinkám a špeciálnym darčekom.
                    </p>
                </section>

                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="form-container"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="luxe-glass-card"
                        >
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="email"
                                    required
                                    className="luxe-input"
                                    placeholder="Zadajte svoj e-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button type="submit" className="luxe-button">
                                    ZAPOJIŤ SA DO SÚŤAŽE
                                </button>
                                <p className="text-[9px] text-gray-500 mt-4 leading-relaxed px-4">
                                    Kliknutím súhlasíte so spracovaním osobných údajov a overením regionálnej dostupnosti súťaže v {location}.
                                </p>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="luxe-glass-card"
                        >
                            <div className="flex flex-col items-center py-4 text-center">
                                <CheckCircle size={60} className="text-[#ff8c00] mb-4" />
                                <h2 className="text-xl font-bold mb-2">STE V HRE O 500€!</h2>
                                <p className="text-sm text-white mb-4 px-2">
                                    Váš unikátny žreb bol práve odoslaný na: <b>{email}</b>
                                </p>
                                <div className="text-xs text-[#a0b0ab] mb-6 px-4 leading-relaxed">
                                    Pre nás v Luxe Boutique je férovosť prvoradá. Aby sme eliminovali duplicitné profily a zabezpečili, že výhra skončí v rukách <b>reálneho človeka z vášho regiónu</b>, zostáva už len posledný krok — <b>potvrdenie vašej polohy</b>. 📍
                                </div>
                                <div className="w-full p-4 border border-dashed border-[#ff8c00]/50 rounded-xl bg-black/40">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Váš overený žreb:</span>
                                    <div className="text-[#ff8c00] font-mono text-xl tracking-[0.2em]">LUXE-999-WYN</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <footer className="w-full py-8 text-[10px] tracking-[0.3em] font-medium text-gray-500 uppercase">
                Live Region: {location}
            </footer>
        </div>
    );
}
