import { http, HttpResponse } from 'msw';

// Mock handlers for Supabase API endpoints
export const handlers = [
  // Auth endpoints
  http.post('https://wrdyffwjlylgxfbxbztf.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    });
  }),

  http.get('https://wrdyffwjlylgxfbxbztf.supabase.co/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      user_metadata: {},
    });
  }),

  // Database endpoints - Will be mocked in individual tests
];
