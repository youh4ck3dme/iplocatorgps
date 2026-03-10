import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Mail, ArrowRight, CheckCircle, MapPin, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function NewsletterPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [location, setLocation] = useState('Slovakia');

    useEffect(() => {
        // Silent IP Geolocation
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => setLocation(`${data.city}, ${data.country_name}`))
            .catch(() => { });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#f59e0b', '#ffffff']
        });

        setSubmitted(true);
    };

    return (
        <div className="newsletter-container font-sans">
            <Head>
                <title>Získaj darček zadarmo | Newsletter Akcia</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <link rel="stylesheet" href="/styles/newsletter.css" />
            </Head>

            <div className="gift-box-wrapper">
                <div className="gift-glow" />
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <Gift size={100} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 px-4"
            >
                <div className="flex justify-center mb-4">
                    <span className="success-badge flex items-center gap-2">
                        <Sparkles size={14} /> Exkluzívne pre {location}
                    </span>
                </div>

                <h1 className="promo-title text-4xl mb-4">
                    Odoberaj newsletter & získaj DARČEK
                </h1>
                <p className="text-gray-400 text-lg mb-8 max-w-sm mx-auto">
                    Pridaj sa k 10,000+ spokojným zákazníkom a my ti k prvej objednávke pribalíme prekvapenie.
                </p>

                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleSubmit}
                            className="newsletter-glass-card mx-auto"
                        >
                            <div className="relative mb-4">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="email"
                                    required
                                    placeholder="Tvoj e-mailový kontakt"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-white placeholder:text-gray-600"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="claim-button flex items-center justify-center gap-2">
                                CHVÁTIŤ DARČEK <ArrowRight size={20} />
                            </button>
                            <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-bold">
                                * Darček bude pripočítaný automaticky
                            </p>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="newsletter-glass-card mx-auto"
                        >
                            <div className="flex justify-center mb-4 text-emerald-400">
                                <CheckCircle size={60} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Vitaj v komunite!</h2>
                            <p className="text-gray-400 mb-6">Tvoj darčekový kód je pripravený:</p>

                            <div className="coupon-code mb-6">
                                GIFT-2026-XMAS
                            </div>

                            <p className="text-xs text-gray-500">
                                Kód bol odoslaný aj na <b>{email}</b>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Decorative localized hint */}
            <div className="absolute bottom-8 text-[10px] text-gray-700 uppercase tracking-[0.3em] font-black">
                Detected Region: {location}
            </div>

            {/* Background radial effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -z-10" />
        </div>
    );
}
