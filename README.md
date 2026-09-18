# Graproh@b | GeoPortal

> Plataforma de Inteligência Geográfica e Análise Espacial do **GRAPROHAB** (Grupo de Análise e Aprovação de Projetos Habitacionais do Estado de São Paulo).

---

## 🗺️ Visão Geral

O **Graproh@b GeoPortal** é uma aplicação web moderna e interativa desenvolvida para centralizar, visualizar e analisar dados territoriais, processos de parcelamento do solo, loteamentos e desmembramentos no Estado de São Paulo.

O portal possui dois ambientes integrados:
1. **Consulta Pública (Cidadão):** Interface limpa e acessível com busca por município, empreendedor, protocolo, ano de entrada e expediente de dispensa.
2. **Ambiente Técnico (Gestor):** Acesso com controle por senha para importação de novos dados GeoJSON/KML/CSV, personalização temática de camadas, gerenciamento de colunas, ordenação de campos e persistência.

---

## ✨ Principais Funcionalidades

* **Visualização Cartográfica Avançada:**
  * Múltiplos mapas base (OpenStreetMap, Satélite ESRI, Relevo, CartoDB Positron/Dark, entre outros).
  * Renderização de geometrias tipo Ponto, Linha e Polígono.
  * Suporte a coordenadas geográficas (WGS84) e reprojeção de sistemas de coordenadas projetadas (UTM / SIRGAS 2000).
* **Filtros e Consultas:**
  * Filtros dinâmicos por município, requerente, status, datas e valores numéricos.
  * Painel de filtragem avançada com múltiplos operadores lógicos (`=`, `>`, `<`, `contains`, `between`).
* **Tabela de Atributos e Inspeção:**
  * Tabela de dados tabular com paginação, busca rápida e ordenação.
  * Painel de detalhes da feição com resumo do empreendimento.
* **Ferramentas Espaciais (GIS):**
  * Medição precisa de distâncias lineares e áreas em m²/hectares (via Turf.js).
  * Estilização visual temática (cores de preenchimento, espessura e opacidade de contorno, raio de vértices).
  * Exportação de dados para GeoJSON, KML e CSV.
* **Inteligência Artificial (Copiloto GIS):**
  * Endpoint integrado à API do Google Gemini (`@google/genai`) para análise descritiva dos dados espaciais e recomendação automatizada de filtros por linguagem natural.
* **Persistência Local (Offline-first):**
  * Armazenamento e sincronização com IndexedDB via `localforage`, permitindo salvar o estado das camadas no próprio navegador.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:**
  * [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  * [Vite](https://vitejs.dev/)
  * [Tailwind CSS](https://tailwindcss.com/)
  * [Leaflet](https://leafletjs.com/)
  * [Turf.js](https://turfjs.org/) (Análise geoespacial e medições de área/perímetro)
  * [Proj4js](https://github.com/proj4js/proj4js) (Reprojeção de coordenadas UTM)
  * [Lucide React](https://lucide.dev/) (Ícones)
* **Backend:**
  * [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
  * [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (Gemini)
* **CI/CD:**
  * GitHub Actions para build e deploy automatizado no GitHub Pages.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* **Node.js** versão 20 ou superior
* **npm** ou gerenciador de pacotes equivalente

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU-USUARIO/graprohab-geoportal.git
cd graprohab-geoportal
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo `.env.example` para `.env`:
```bash
cp .env.example .env
```
*(Opcional: Adicione sua chave `GEMINI_API_KEY` caso deseje utilizar o Copiloto IA).*

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O portal estará disponível em: `http://localhost:3000`

---

## 📦 Build e Produção

Para gerar a versão otimizada de produção:
```bash
npm run build
```

Para rodar o servidor compilado:
```bash
npm start
```

---

## 📄 Licença

Distribuído sob licença aberta para fins educacionais, públicos e governamentais.
