import { beforeEach, describe, expect, it } from 'vitest';
import locationHandler from '../pages/api/location';
import sessionHandler from '../pages/api/session/[token]';
import { clearSessionStore } from '../lib/sqliteStore';

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };
}

describe('GET /api/session/[token]', () => {
  beforeEach(async () => {
    await clearSessionStore();
  });

  it('rejects non-GET methods', async () => {
    const req = { method: 'POST', query: { token: 'x' } };
    const res = createRes();

    await sessionHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.payload).toEqual({ error: 'Method not allowed' });
  });

  it('returns 400 when token is missing', async () => {
    const req = { method: 'GET', query: {} };
    const res = createRes();

    await sessionHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: 'Missing token' });
  });

  it('returns 404 when session does not exist', async () => {
    const req = { method: 'GET', query: { token: 'missing' } };
    const res = createRes();

    await sessionHandler(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('returns stored points for token session', async () => {
    await locationHandler({ method: 'POST', body: { token: 's1', lat: 48.1, lng: 17.1, accuracy: 12 } }, createRes());

    const req = { method: 'GET', query: { token: 's1' } };
    const res = createRes();

    await sessionHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
    expect(res.payload.session.token).toBe('s1');
    expect(res.payload.session.count).toBe(1);
  });

  it('accepts token as query array and uses first value', async () => {
    await locationHandler({ method: 'POST', body: { token: 'arr-token', lat: 48.3, lng: 17.3 } }, createRes());

    const req = { method: 'GET', query: { token: ['arr-token', 'other'] } };
    const res = createRes();

    await sessionHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.session.token).toBe('arr-token');
  });
});
