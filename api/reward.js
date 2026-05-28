let balances = {};
let lastClaim = {};

export default function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegram_id } = req.body;

  if (!telegram_id) {
    return res.status(400).json({ error: 'No user' });
  }

  // Anti spam sederhana (5 detik)
  const now = Date.now();
  if (lastClaim[telegram_id] && now - lastClaim[telegram_id] < 5000) {
    return res.status(429).json({
      error: 'Too fast'
    });
  }

  lastClaim[telegram_id] = now;

  // init balance
  if (!balances[telegram_id]) {
    balances[telegram_id] = 0;
  }

  // 🎯 POINT BESAR (RANDOM)
  const reward = Math.floor(Math.random() * 200) + 100; 
  // hasil: 100 - 300 point

  balances[telegram_id] += reward;

  return res.status(200).json({
    success: true,
    reward: reward,
    balance: balances[telegram_id]
  });
}
