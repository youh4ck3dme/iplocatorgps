import { useState } from 'react';
import Head from 'next/head';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                window.location.href = '/';
            } else {
                setError('Nesprávne heslo. Skúste to znova.');
            }
        } catch (err) {
            setError('Chyba spojenia so serverom.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 font-sans">
            <Head>
                <title>Zabezpečený prístup | Login</title>
            </Head>

            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-6">
                        <Lock className="text-black" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Zabezpečený prístup</h1>
                    <p className="text-slate-500">Tento systém je chránený. Zadajte heslo pre pokračovanie.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Zadajte heslo"
                            autoFocus
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-center text-xl tracking-widest"
                            required
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm text-center font-medium">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Odomknúť prístup'
                        )}
                    </button>
                </form>

                <p className="mt-12 text-center text-slate-400 text-sm">
                    © {new Date().getFullYear()} pop-mart.cloud Security System
                </p>
            </div>
        </div>
    );
}
