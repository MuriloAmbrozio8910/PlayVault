const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const ITAD_API_KEY = process.env.ITAD_API_KEY || 'bc111ff70ce3ebaf6447395372d4f06d401d151f';
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id missing' });

  try {
    // ITAD API espera id (UUID) como parâmetro singular
    const url = `https://api.isthereanydeal.com/games/info/v2?key=${ITAD_API_KEY}&id=${id}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'ITAD game detail fetch failed', details: err.message });
  }
};
