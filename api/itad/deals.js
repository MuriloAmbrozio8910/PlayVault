const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const ITAD_API_KEY = process.env.ITAD_API_KEY || 'bc111ff70ce3ebaf6447395372d4f06d401d151f';
  try {
    const url = `https://api.isthereanydeal.com/deals/v2?key=${ITAD_API_KEY}&region=br&country=BR&shops=61,62,50,48,35,16,52,4&sort=-trending&limit=10`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'ITAD deals fetch failed', details: err.message });
  }
};
