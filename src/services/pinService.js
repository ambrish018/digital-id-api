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
  if (!global_id) {
    throw new Error('global_id is required');
  }

  // 1️⃣ Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('global_id', global_id)
    .maybeSingle();

  if (fetchError) {
    throw new Error('Failed to fetch user');
  }

  // 2️⃣ Validate input (required for both insert & update)
  if (!name || !email || !phone) {
    throw new Error('Incomplete user details');
  }

  // 3️⃣ Update OR Insert user
  if (existingUser) {
    // 🔁 UPDATE
    const { error: updateError } = await supabase
      .from('users')
      .update({ name, email, phone })
      .eq('global_id', global_id);

    if (updateError) {
      throw new Error('Failed to update user');
    }
  } else {
    // ➕ INSERT
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ global_id, name, email, phone }]);

    if (insertError) {
      throw new Error('Failed to create user');
    }
  }

  // 4️⃣ Invalidate old PINs
  await supabase
    .from('active_pins')
    .delete()
    .eq('global_id', global_id);

  // 5️⃣ Generate new PIN & QR
  const pin = await generateUniquePin();
  const qr_token = uuidv4();
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // 6️⃣ Store active PIN
  const { error: pinError } = await supabase.from('active_pins').insert([
    { pin, global_id, qr_token, expires_at },
  ]);

  if (pinError) {
    throw new Error('Failed to store PIN');
  }

  // 7️⃣ Response
  return {
    pin,
    verification_url: `${process.env.WEB_APP_BASE_URL}/verify?pin=${pin}`,
  };
}


export async function verifyPin(pin) {
  if (!pin || !/^\d{6}$/.test(pin)) {
    throw new Error('User not valid');
  }

  // 1️⃣ Find valid PIN
  const { data: activePin } = await supabase
    .from('active_pins')
    .select('global_id')
    .eq('pin', pin)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!activePin) {
    throw new Error('User not valid');
  }

  // 2️⃣ Fetch user
  const { data: user } = await supabase
    .from('users')
    .select('name, email, phone, global_id')
    .eq('global_id', activePin.global_id)
    .single();

  if (!user) {
    throw new Error('User not valid');
  }

  // 3️⃣ 🔥 DELETE PIN (ONE-TIME USE)
  await supabase
    .from('active_pins')
    .delete()
    .eq('pin', pin);

  // 4️⃣ Return user
  return user;
}
