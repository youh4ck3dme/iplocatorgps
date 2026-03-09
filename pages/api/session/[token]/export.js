import { getSessionSnapshot } from '../../../../lib/sqliteStore';

function toGpx(session) {
  const pointsXml = session.points
    .map(
      (point) =>
        `<trkpt lat="${point.lat}" lon="${point.lng}"><time>${point.timestamp}</time>${
          typeof point.altitude === 'number' ? `<ele>${point.altitude}</ele>` : ''
        }</trkpt>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="location-tracker" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>session-${session.token}</name></metadata>
  <trk>
    <name>session-${session.token}</name>
    <trkseg>${pointsXml}</trkseg>
  </trk>
</gpx>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tokenParam = req.query.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const formatParam = req.query.format;
  const format = (Array.isArray(formatParam) ? formatParam[0] : formatParam || 'json').toLowerCase();

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  if (format !== 'json' && format !== 'gpx') {
    return res.status(400).json({ error: 'Unsupported format' });
  }

  const session = await getSessionSnapshot(token, 5000);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (format === 'gpx') {
    const filename = `session-${token}.gpx`;
    res.setHeader('Content-Type', 'application/gpx+xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(toGpx(session));
  }

  res.setHeader('Content-Disposition', `attachment; filename="session-${token}.json"`);
  return res.status(200).json({ ok: true, session });
}
