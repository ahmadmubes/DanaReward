import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const MAX_DAILY = 20;
const REWARD = 200;
const COOLDOWN = 15000;

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegram_id, ads_session } = req.body;

  if (!telegram_id) {
    return res.status(400).json({ error: 'No user' });
  }

  // VALIDASI ADS SESSION
  if (ads_session !== "done") {
    return res.status(403).json({
      error: "Invalid ads session"
    });
  }

  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        telegram_id,
        balance: 0,
        daily_count: 0,
        last_claim: null,
        last_reset: new Date().toDateString()
      })
      .select()
      .single();

    user = newUser;
  }

  const now = Date.now();

  if (user.last_claim) {
    const diff = now - new Date(user.last_claim).getTime();

    if (diff < COOLDOWN) {
      return res.status(429).json({
        error: 'Cooldown aktif',
        cooldown_left: Math.ceil((COOLDOWN - diff) / 1000)
      });
    }
  }

  const today = new Date().toDateString();

  if (user.last_reset !== today) {
    user.daily_count = 0;

    await supabase
      .from('users')
      .update({
        last_reset: today,
        daily_count: 0
      })
      .eq('telegram_id', telegram_id);
  }

  if (user.daily_count >= MAX_DAILY) {
    return res.status(403).json({
      error: 'Limit harian habis'
    });
  }

  const newBalance = (user.balance || 0) + REWARD;
  const newCount = (user.daily_count || 0) + 1;

  const { data: updated } = await supabase
    .from('users')
    .update({
      balance: newBalance,
      daily_count: newCount,
      last_claim: new Date().toISOString()
    })
    .eq('telegram_id', telegram_id)
    .select()
    .single();

  return res.status(200).json({
    success: true,
    reward: REWARD,
    balance: updated.balance,
    remaining_today: MAX_DAILY - updated.daily_count
  });
}
