import { auth } from './firebase';
export async function apiRequest(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const user = auth.currentUser;
  if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  try {
    const response = await fetch(path, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(12000) });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API returned HTML instead of JSON. Check the backend deployment and /api routing.');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  } catch (error) {
    console.error(`[API ${options.method || 'GET'} ${path}]`, error);
    throw error;
  }
}
