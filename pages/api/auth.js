export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body;

    // The password requested by the user
    if (password === process.env.ADMIN_PASSWORD) {
        // Set a simple cookie for authentication
        // In a production app, this would be a signed JWT or session ID
        res.setHeader('Set-Cookie', 'auth_token=valid_session; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400');
        return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ error: 'Invalid password' });
}
