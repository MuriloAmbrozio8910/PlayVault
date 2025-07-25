# Backend Serverless API (Vercel)

Esta pasta contém as funções serverless para os endpoints da sua API, prontas para deploy na Vercel.

## Estrutura de Endpoints

- `/api/hltb/[id]` — Detalhes de tempo de jogo HowLongToBeat por ID (UUID do HLTB)
- `/api/hltb/search?q=nome` — Busca de jogos por nome no HowLongToBeat
- `/api/itad/deals` — Lista de promoções em destaque da ITAD
- `/api/itad/games` — Lista de jogos em promoção (ITAD)
- `/api/game/[id]` — Detalhes de um jogo na ITAD (UUID)
- `/api/itad/info?ids=uuid1,uuid2` — Detalhes de múltiplos jogos na ITAD (opcional)

## Como usar na Vercel

1. Faça deploy do projeto na Vercel.
2. Configure as variáveis de ambiente no painel da Vercel (`ITAD_API_KEY`).
3. Os endpoints ficam disponíveis em `https://seu-projeto.vercel.app/api/...`
4. O frontend deve consumir os endpoints relativos (`/api/...`), funcionando local e em produção.

## Observações
- Não é necessário `express` ou `app.listen`.
- Cada arquivo exporta uma função `(req, res) => { ... }`.
- Dependências como `howlongtobeat` e `node-fetch` devem estar no `package.json` na raiz do projeto.
