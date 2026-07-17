import { supabase } from '../lib/supabase';

const parseApiError = async (res: Response) => {
  const data = await res.json().catch(() => null);
  const message = data?.error || res.statusText || 'API error';
  const error = new Error(`API error ${res.status}: ${message}`);
  (error as any).status = res.status;
  throw error;
};

const getHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

export const apiClient = {
  get: async (url: string) => {
    const res = await fetch(url, {
      headers: await getHeaders()
    });
    if (!res.ok) await parseApiError(res);
    return res.json();
  },
  
  post: async (url: string, data?: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) await parseApiError(res);
    return res.json();
  },
  
  put: async (url: string, data?: any) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: await getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) await parseApiError(res);
    return res.json();
  },
  
  delete: async (url: string) => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    if (!res.ok) await parseApiError(res);
    return res.json();
  }
};
