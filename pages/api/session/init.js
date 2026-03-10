import { setSessionEmail } from '../../../lib/sqliteStore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, email } = req.body || {};

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Invalid token' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        await setSessionEmail(token, email);
        return res.status(200).json({ ok: true, message: 'Session initialized' });
    } catch (err) {
        console.error('Failed to initialize session metadata:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
