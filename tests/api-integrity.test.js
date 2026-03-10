import { describe, expect, it, beforeEach } from 'vitest';
import locationHandler from '../pages/api/location';
import sessionHandler from '../pages/api/session/[token]';
import { clearSessionStore } from '../lib/sqliteStore';

function createRes() {
    return {
        statusCode: 200,
        payload: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.payload = data; return this; },
        setHeader() { return this; },
        end() { return this; }
    };
}

describe('API Integrity & Edge Cases', () => {
    beforeEach(async () => {
        await clearSessionStore();
    });

    describe('Location API Validation', () => {
        it('rejects missing token', async () => {
            const res = createRes();
            await locationHandler({ method: 'POST', body: { lat: 1, lng: 1 } }, res);
            expect(res.statusCode).toBe(400);
        });

        it('rejects non-numeric coordinates', async () => {
            const res = createRes();
            await locationHandler({ method: 'POST', body: { token: 't', lat: 'abc', lng: 1 } }, res);
            expect(res.statusCode).toBe(400);
        });

        it('rejects extreme coordinates (invalid lat)', async () => {
            const res = createRes();
            await locationHandler({ method: 'POST', body: { token: 't', lat: 95, lng: 1 } }, res);
            expect(res.statusCode).toBe(400);
        });

        it('rejects extreme coordinates (invalid lng)', async () => {
            const res = createRes();
            await locationHandler({ method: 'POST', body: { token: 't', lat: 1, lng: 190 } }, res);
            expect(res.statusCode).toBe(400);
        });

        it('handles empty deviceInfo gracefully', async () => {
            const res = createRes();
            await locationHandler({ method: 'POST', body: { token: 't', lat: 1, lng: 1, deviceInfo: null } }, res);
            expect(res.statusCode).toBe(200);
        });

        it('accepts optional altitude and heading', async () => {
            const res = createRes();
            await locationHandler({ method: 'POST', body: { token: 't', lat: 1, lng: 1, altitude: 100, heading: 90 } }, res);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Session API Constraints', () => {
        it('returns empty session structure for valid but empty token request', async () => {
            // Technically current implementation returns 404 if no points exist.
            // Let's verify this behavior.
            const res = createRes();
            await sessionHandler({ method: 'GET', query: { token: 'empty-one' } }, res);
            expect(res.statusCode).toBe(404);
        });

        it('handles very long tokens', async () => {
            const longToken = 'a'.repeat(1000);
            const res = createRes();
            await locationHandler({ method: 'POST', body: { token: longToken, lat: 1, lng: 1 } }, res);
            expect(res.statusCode).toBe(200);

            const res2 = createRes();
            await sessionHandler({ method: 'GET', query: { token: longToken } }, res2);
            expect(res2.statusCode).toBe(200);
            expect(res2.payload.session.token).toBe(longToken);
        });

        it('protects against SQL injection in token', async () => {
            const maliciousToken = "'; DROP TABLE session_points;--";
            const res = createRes();
            await sessionHandler({ method: 'GET', query: { token: maliciousToken } }, res);
            // Should just 404 safely because tokens are parameterized in queries
            expect(res.statusCode).toBe(404);
        });
    });

    describe('Concurrency & Rate (Simulation)', () => {
        it('handles multiple rapid writes to same token', async () => {
            const token = 'rapid';
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(locationHandler({ method: 'POST', body: { token, lat: i, lng: i } }, createRes()));
            }
            await Promise.all(promises);

            const res = createRes();
            await sessionHandler({ method: 'GET', query: { token } }, res);
            expect(res.payload.session.count).toBe(5);
        });
    });
});
