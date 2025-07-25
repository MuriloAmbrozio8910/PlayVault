const { HowLongToBeatService } = require('howlongtobeat');
const service = new HowLongToBeatService();

module.exports = async (req, res) => {
  const { id } = req.query;
  try {
    const detail = await service.detail(id);
    res.status(200).json(detail);
  } catch (e) {
    res.status(404).json({ error: 'not found' });
  }
};
