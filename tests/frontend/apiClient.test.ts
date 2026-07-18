import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
          },
        },
      }),
    },
  },
}));

import { apiClient } from '../../src/services/api';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia authorization header en GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiClient.get('/api/health');

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }),
    }));
  });

  it('lanza error parseado cuando API responde no-ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: vi.fn().mockResolvedValue({ error: 'invalid payload' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.post('/api/x', { a: 1 })).rejects.toThrow('API error 400: invalid payload');
  });
});
