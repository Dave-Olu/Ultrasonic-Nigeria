import { NextResponse } from 'next/server';
import { createAdminEmailLoginToken } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_AUTH_FROM_EMAIL;
  const configuredBaseUrl = process.env.APP_BASE_URL;

  if (!apiKey || !from || (process.env.NODE_ENV === 'production' && !configuredBaseUrl)) {
    return NextResponse.json({ error: 'Email sign-in is not configured.' }, { status: 503 });
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredBaseUrl || new URL(request.url).origin);
  } catch {
    return NextResponse.json({ error: 'Email sign-in is not configured.' }, { status: 503 });
  }
  if (process.env.NODE_ENV === 'production' && baseUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Email sign-in requires an HTTPS application URL.' }, { status: 503 });
  }

  const result = await createAdminEmailLoginToken();
  if (result.status !== 'created') {
    return NextResponse.json({ success: true, message: 'If an admin account is available, a sign-in link will be sent.' });
  }

  const signInUrl = new URL('/admin/login', baseUrl);
  signInUrl.hash = new URLSearchParams({ token: result.token }).toString();
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [result.email],
      subject: 'Your Ultrasonic admin sign-in link',
      html: `<p>Use this link to sign in to the Ultrasonic admin dashboard. It expires in 10 minutes and can only be used once.</p><p><a href="${signInUrl.toString()}">Sign in to admin</a></p><p>If you did not request this link, you can ignore this email.</p>`,
    }),
  });

  if (!emailResponse.ok) {
    return NextResponse.json({ error: 'Unable to send the sign-in email. Check the email service configuration.' }, { status: 502 });
  }

  return NextResponse.json({ success: true, message: 'If an admin account is available, a sign-in link will be sent.' });
}