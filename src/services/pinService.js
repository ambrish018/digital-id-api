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
