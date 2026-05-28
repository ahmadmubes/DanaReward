let balances = {};

export default function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const { telegram_id } = req.body;

  if (!balances[telegram_id]) {
    balances[telegram_id] = 0;
  }

  balances[telegram_id] += 10;

  return res.status(200).json({
    success: true,
    reward: 10,
    balance: balances[telegram_id]
  });
}
