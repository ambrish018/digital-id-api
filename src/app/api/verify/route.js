import { NextResponse } from 'next/server';
import { verifyPin } from '@/services/pinService';
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
export async function POST(req) {
  try {
    const { pin } = await req.json();

    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await verifyPin(String(pin));

    return NextResponse.json(user, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Verify PIN failed:', err.message);

    return NextResponse.json(
      { error: 'User not valid or PIN expired' },
      { status: 404, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 200,
    headers: corsHeaders,
  });
}
