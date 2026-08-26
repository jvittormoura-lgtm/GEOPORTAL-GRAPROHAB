import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Proxy for live real-time USGS earthquakes feed (avoids CORS issues)
  app.get('/api/realtime/earthquakes', async (req, res) => {
    try {
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
      if (!response.ok) {
        throw new Error(`USGS HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao buscar feed sísmico em tempo real', details: err.message });
    }
  });

  // AI GIS Assistant endpoint using Gemini
  app.post('/api/ai-gis-assistant', async (req, res) => {
    try {
      const { prompt, layerName, propertiesSchema, sampleFeatures } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'O prompt é obrigatório' });
      }

      const client = getAiClient();
      if (!client) {
        return res.status(503).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor. Forneça análises locais ou configure a chave nos Segredos.',
          fallback: true
        });
      }

      const systemInstruction = `Você é o WebMap GIS Copilot, um especialista em Sistemas de Informação Geográfica (GIS), análise espacial e processamento GeoJSON.
Responda sempre em Português do Brasil com clareza técnica e objetividade.
Quando o usuário pedir para filtrar dados com base em uma pergunta ou comando, além da explicação amigável, forneça se aplicável um bloco JSON estruturado de sugestão de filtro no formato:
\`\`\`json
{
  "suggestedFilter": {
    "property": "nome_do_campo",
    "operator": "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in",
    "value": 100,
    "explanation": "Filtrando registros onde campo > 100"
  },
  "spatialInsight": "Resumo analítico espacial dos dados"
}
\`\`\``;

      const userContent = `Camada ativa: "${layerName || 'Sem camada selecionada'}"
Esquema de Atributos: ${JSON.stringify(propertiesSchema || [])}
Amostra de dados (primeiros registros): ${JSON.stringify((sampleFeatures || []).slice(0, 3))}

Pergunta / Pedido do usuário:
${prompt}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userContent}` }] }
        ]
      });

      res.json({
        response: response.text,
        success: true
      });
    } catch (error: any) {
      console.error('Erro na API AI GIS:', error);
      res.status(500).json({
        error: error.message || 'Erro interno ao processar consulta com Gemini'
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WebMap GIS Studio rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
