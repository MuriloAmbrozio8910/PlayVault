// Backend Express server for ITAD and RAWG integration
const express = require('express');
const { HowLongToBeatService } = require('howlongtobeat');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const service = new HowLongToBeatService();
const app = express();
const PORT = 3333;

app.use(cors());

// ITAD API KEY from env or fallback
const ITAD_API_KEY = process.env.ITAD_API_KEY || 'bc111ff70ce3ebaf6447395372d4f06d401d151f';

// Endpoint para HowLongToBeat
app.get('/hltb/:id', async (req, res) => {
  try {
    const detail = await service.detail(req.params.id);
    res.json(detail);
  } catch (e) {
    res.status(404).json({ error: 'not found' });
  }
});

// Proxy for ITAD Deals (homepage discounts)
app.get('/hltb/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'query missing' });
    const results = await service.search(q);
    res.json(results);
});

// Endpoint para ITAD Show all games
app.get('/itad/games', async (req, res) => {
    try {
        const url = `https://api.isthereanydeal.com/deals/v2?key=${ITAD_API_KEY}&region=br&country=BR&shops=61,62,50,48,35,16,52,4&sort=-trending&limit=200`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'ITAD games fetch failed', details: err.message });
    }
});

// Endpoint detalhado para página de detalhes do jogo
app.get('/game/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
        // Busca detalhes do jogo na ITAD usando o endpoint correto
        const url = `https://api.isthereanydeal.com/games/info/v2?key=${ITAD_API_KEY}&id=${encodeURIComponent(id)}`;
        const itadRes = await fetch(url);
        const itadData = await itadRes.json();
        // Verifica se a resposta da ITAD é válida e contém dados do jogo
        if (itadRes.ok && itadData && itadData.id) {
            res.json(itadData);
        } else {
            res.status(404).json({ error: 'Game not found', details: itadData });
        }
    } catch (err) {
        res.status(500).json({ error: 'Game detail fetch failed', details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
