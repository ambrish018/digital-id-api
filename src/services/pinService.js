import supabase from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

function generateSixDigitPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateUniquePin() {
  let pin;
  let exists = true;

  while (exists) {
    pin = generateSixDigitPin();

    const { data } = await supabase
      .from('active_pins')
      .select('pin')
      .eq('pin', pin)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    exists = !!data;
  }

  return pin;
}

export async function generatePinAndQr({ name, email, phone, global_id }) {
  if (!global_id) throw new Error('global_id is required');

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('global_id', global_id)
    .maybeSingle();

  if (!user) {
    if (!name || !email || !phone) {
      throw new Error('Incomplete user details');
    }

    await supabase.from('users').insert([
      { global_id, name, email, phone },
    ]);
  }

  await supabase
    .from('active_pins')
    .delete()
    .eq('global_id', global_id);

  const pin = await generateUniquePin();
  const qr_token = uuidv4();

  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabase.from('active_pins').insert([
    { pin, global_id, qr_token, expires_at },
  ]);

  return {
    pin,
    verification_url: `${process.env.WEB_APP_BASE_URL}/verify?pin=${pin}`,
  };
}

export async function verifyPin(pin) {
  if (!pin || !/^\d{6}$/.test(pin)) {
    throw new Error('User not valid');
  }

  const { data: activePin } = await supabase
    .from('active_pins')
    .select('global_id, expires_at')
    .eq('pin', pin)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!activePin) {
    throw new Error('User not valid');
  }

  const { data: user } = await supabase
    .from('users')
    .select('name, email, phone, global_id')
    .eq('global_id', activePin.global_id)
    .single();

  if (!user) {
    throw new Error('User not valid');
  }

  return user;
}
