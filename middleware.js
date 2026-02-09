import { NextResponse } from 'next/server';

export function middleware(req) {
  const res = NextResponse.next();

  res.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return res;
}

export const config = {
  matcher: '/api/:path*',
};
