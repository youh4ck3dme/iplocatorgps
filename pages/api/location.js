import axios from 'axios';
import { appendSessionPoint } from '../../lib/sqliteStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    token,
    lat,
    lng,
    accuracy,
    altitude = null,
    heading = null,
    speed = null,
    deviceInfo = {}
  } = req.body || {};

  if (
    !token ||
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    lat < -90 || lat > 90 ||
    lng < -180 || lng > 180
  ) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const timestamp = new Date().toISOString();
  const point = {
    lat,
    lng,
    accuracy: typeof accuracy === 'number' ? accuracy : null,
    altitude,
    heading,
    speed,
    timestamp,
    deviceInfo
  };

  const session = await appendSessionPoint(token, point);

  console.log('Location update', {
    token,
    lat,
    lng,
    accuracy,
    altitude,
    heading,
    speed,
    deviceInfo,
    receivedAt: timestamp
  });

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (telegramToken && chatId) {
    const message = [
      `📍 New location token: ${token}`,
      `lat: ${lat}`,
      `lng: ${lng}`,
      `accuracy: ${accuracy ?? 'n/a'} m`,
      `platform: ${deviceInfo.platform ?? 'n/a'}`
    ].join('\n');

    try {
      await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        chat_id: chatId,
        text: message
      });
    } catch (err) {
      console.error('Telegram notification failed', err?.message || err);
    }
  }

  return res.status(200).json({ ok: true, pointsStored: session.pointsStored, lastUpdateAt: timestamp });
}
