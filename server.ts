import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!aiClient && apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
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

      const systemInstruction = `Você é o WebMap GIS Copilot, um especialista em Sistemas de Informação Geográfica (GIS), análise de dados e processamento GeoJSON.
Responda sempre em Português do Brasil de forma elegante, direta e com clareza técnica.
Você receberá os dados da camada (ou uma grande amostra). O usuário pode pedir para filtrar dados ou pedir informações analíticas.
IMPORTANTE SOBRE A SUA ANÁLISE:
- Se o usuário pedir rankings (ex: "Top 10", "Maiores", "Menores") ou totalizações, você DEVE calcular isso usando os dados JSON fornecidos no prompt e escrever a lista resultante diretamente no texto da resposta. NUNCA diga que o usuário precisa aplicar o filtro primeiro para ver o resultado; você é o analista, faça a contagem internamente e entregue a lista pronta no texto.
IMPORTANTE SOBRE A FORMATAÇÃO: 
1. Mantenha o texto limpo e agradável de ler para um usuário comum. 
2. Evite o uso excessivo de asteriscos (***). Use formatação apenas para destacar informações vitais. 
3. Se gerar listas, use bullet points simples (-).

Forneça a sua resposta analítica em texto (estatísticas, rankings, etc) e, no FINAL da sua resposta, se o usuário pedir para FILTRAR algo, anexe um bloco JSON estruturado de sugestão de filtro no formato exato abaixo (e nada mais no JSON):
\`\`\`json
{
  "suggestedFilter": {
    "property": "nome_do_campo",
    "operator": "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in",
    "value": 100,
    "explanation": "Breve explicação do filtro"
  }
}
\`\`\``;

      const featuresToAnalyze = sampleFeatures || [];
      const dataToPrompt = featuresToAnalyze.length > 5000 
          ? featuresToAnalyze.slice(0, 5000) 
          : featuresToAnalyze;

      const userContent = `Camada ativa: "${layerName || 'Sem camada selecionada'}"
Esquema de Atributos: ${JSON.stringify(propertiesSchema || [])}
Dados para análise (limite de 5000 registros): ${JSON.stringify(dataToPrompt)}

Pergunta / Pedido do usuário:
${prompt}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.6-flash',
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
