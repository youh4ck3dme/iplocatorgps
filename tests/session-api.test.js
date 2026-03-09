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

  it('returns 404 when session does not exist', async () => {
    const req = { method: 'GET', query: { token: 'missing' } };
    const res = createRes();

    await sessionHandler(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('returns stored points for token session', async () => {
    const ingestReq = { method: 'POST', body: { token: 's1', lat: 48.1, lng: 17.1, accuracy: 12 } };
    const ingestRes = createRes();
    await locationHandler(ingestReq, ingestRes);

    const req = { method: 'GET', query: { token: 's1' } };
    const res = createRes();
    await sessionHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
    expect(res.payload.session.token).toBe('s1');
    expect(res.payload.session.count).toBe(1);
  });
});
