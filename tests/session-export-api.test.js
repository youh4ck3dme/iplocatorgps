import { beforeEach, describe, expect, it } from 'vitest';
import locationHandler from '../pages/api/location';
import exportHandler from '../pages/api/session/[token]/export';
import { clearSessionStore } from '../lib/sqliteStore';

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    text: '',
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
    send(data) {
      this.text = data;
      return this;
    }
  };
}

describe('GET /api/session/[token]/export', () => {
  beforeEach(async () => {
    await clearSessionStore();
  });

  it('rejects non-GET methods', async () => {
    const req = { method: 'POST', query: { token: 'abc', format: 'json' } };
    const res = createRes();

    await exportHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.payload).toEqual({ error: 'Method not allowed' });
  });

  it('returns 400 when token is missing', async () => {
    const req = { method: 'GET', query: { format: 'json' } };
    const res = createRes();

    await exportHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: 'Missing token' });
  });

  it('returns 404 for missing session', async () => {
    const req = { method: 'GET', query: { token: 'none', format: 'json' } };
    const res = createRes();

    await exportHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.payload).toEqual({ error: 'Session not found' });
  });

  it('returns 400 for unsupported format', async () => {
    const req = { method: 'GET', query: { token: 'abc', format: 'csv' } };
    const res = createRes();

    await exportHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: 'Unsupported format' });
  });

  it('defaults to json format when format is not provided', async () => {
    await locationHandler({ method: 'POST', body: { token: 'exp0', lat: 48.0, lng: 17.0 } }, createRes());

    const req = { method: 'GET', query: { token: 'exp0' } };
    const res = createRes();

    await exportHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
    expect(res.headers['Content-Disposition']).toContain('session-exp0.json');
  });

  it('exports session as json', async () => {
    await locationHandler({ method: 'POST', body: { token: 'exp1', lat: 48.1, lng: 17.1 } }, createRes());

    const req = { method: 'GET', query: { token: 'exp1', format: 'json' } };
    const res = createRes();

    await exportHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
    expect(res.payload.session.token).toBe('exp1');
    expect(res.headers['Content-Disposition']).toContain('session-exp1.json');
  });

  it('exports session as gpx including elevation when altitude exists', async () => {
    await locationHandler(
      { method: 'POST', body: { token: 'exp2', lat: 48.2, lng: 17.2, altitude: 123.45 } },
      createRes()
    );

    const req = { method: 'GET', query: { token: 'exp2', format: 'gpx' } };
    const res = createRes();

    await exportHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('application/gpx+xml');
    expect(res.headers['Content-Disposition']).toContain('session-exp2.gpx');
    expect(res.text).toContain('<gpx');
    expect(res.text).toContain('<ele>123.45</ele>');
  });
});
