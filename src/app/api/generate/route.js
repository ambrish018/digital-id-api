import { NextResponse } from 'next/server';
import { generatePinAndQr } from '@/services/pinService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, global_id } = body;

    // Basic validations
    if (!name || !email || !phone || !global_id) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(global_id)) {
      return NextResponse.json(
        { error: 'Global ID must be 6 digits' },
        { status: 400 }
      );
    }

    const result = await generatePinAndQr({
      name,
      email,
      phone,
      global_id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
