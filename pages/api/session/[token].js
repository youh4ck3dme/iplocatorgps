import { getSessionSnapshot } from '../../../lib/sqliteStore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tokenParam = req.query.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  const session = await getSessionSnapshot(token);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  return res.status(200).json({ ok: true, session });
}
