import { NextResponse } from 'next/server';
import { consumeAdminEmailLoginToken, createSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const body = await request.json();
  const email = await consumeAdminEmailLoginToken(String(body.token ?? ''));
  if (!email) {
    return NextResponse.json({ error: 'This sign-in link is invalid, expired, or already used.' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, createSession(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return response;
}