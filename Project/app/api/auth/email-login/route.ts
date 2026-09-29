import { NextResponse } from 'next/server';
import { consumeAdminEmailLoginToken, createSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/admin-auth';

export async function POST(request: Request) {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const token = String(body.token ?? '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Sign-in token is required.' }, { status: 400 });
  }

  try {
    const email = await consumeAdminEmailLoginToken(token);
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
  } catch (error) {
    console.error('Email sign-in error:', error);
    return NextResponse.json({ error: 'Unable to complete email sign-in.' }, { status: 500 });
  }
}