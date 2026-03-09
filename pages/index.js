import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createTrackingLink } from '../lib/trackingLink';

export default function HomePage() {
  const trackingLink = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    const token = uuidv4();
    return createTrackingLink(window.location.origin, token);
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Location Tracker</h1>
      <p>Generate a one-time testing link and open it on a mobile device.</p>

      {trackingLink ? (
        <>
          <p>
            <a href={trackingLink}>{trackingLink}</a>
          </p>
          <button onClick={() => navigator.clipboard.writeText(trackingLink)}>Copy link</button>
        </>
      ) : (
        <p>Preparing link...</p>
      )}
    </main>
  );
}
