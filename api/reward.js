let balances = {};
let lastClaim = {};
let dailyCount = {};
let lastReset = {};
let penalty = {}; // untuk tab spam

const MAX_DAILY = 20;
const BASE_COOLDOWN = 15000; // 15 detik

function resetDailyIfNeeded(id) {
  const today = new Date().toDateString();

  if (lastReset[id] !== today) {
    dailyCount[id] = 0;
    lastReset[id] = today;
  }
}

function getCooldown(id) {
  // 🔥 kalau user spam → cooldown naik
  let extra = penalty[id] || 0;

  // max cooldown 60 detik
  return Math.min(BASE_COOLDOWN + extra, 60000);
}

export default function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegram_id } = req.body;

  if (!telegram_id) {
    return res.status(400).json({ error: 'No user' });
  }

  const now = Date.now();

  resetDailyIfNeeded(telegram_id);

  if (!dailyCount[telegram_id]) dailyCount[telegram_id] = 0;
  if (!penalty[telegram_id]) penalty[telegram_id] = 0;

  // ⛔ cooldown dinamis
  const cooldown = getCooldown(telegram_id);

  if (lastClaim[telegram_id] && now - lastClaim[telegram_id] < cooldown) {

    // 🔥 tambah penalty kalau terlalu cepat klik
    penalty[telegram_id] += 2000; // tambah 2 detik setiap spam

    return res.status(429).json({
      error: 'Cooldown aktif',
      cooldown_left: Math.ceil((cooldown - (now - lastClaim[telegram_id])) / 1000)
    });
  }

  // reset penalty pelan-pelan (biar tidak terlalu berat)
  penalty[telegram_id] = Math.max(0, penalty[telegram_id] - 1000);

  // limit harian
  if (dailyCount[telegram_id] >= MAX_DAILY) {
    return res.status(403).json({
      error: 'Limit harian habis'
    });
  }

  lastClaim[telegram_id] = now;
  dailyCount[telegram_id]++;

  if (!balances[telegram_id]) {
    balances[telegram_id] = 0;
  }

  const reward = 200;

  balances[telegram_id] += reward;

  return res.status(200).json({
    success: true,
    reward: reward,
    balance: balances[telegram_id],
    remaining_today: MAX_DAILY - dailyCount[telegram_id],
    cooldown: getCooldown(telegram_id)
  });
}
