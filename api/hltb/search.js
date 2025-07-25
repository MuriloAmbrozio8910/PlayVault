const { HowLongToBeatService } = require('howlongtobeat');
const service = new HowLongToBeatService();

module.exports = async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'query missing' });
  const results = await service.search(q);
  res.status(200).json(results);
};
