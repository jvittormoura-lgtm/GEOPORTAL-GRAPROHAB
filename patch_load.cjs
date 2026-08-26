const fs = require('fs');

// 1. Fix firebaseUtils.ts chunk size
let utils = fs.readFileSync('src/lib/firebaseUtils.ts', 'utf8');
utils = utils.replace('const CHUNK_SIZE = 900000;', 'const CHUNK_SIZE = 400000;');
utils = utils.replace('if (!mainData.chunkCount)', 'if (mainData.chunkCount === undefined)');
fs.writeFileSync('src/lib/firebaseUtils.ts', utils);

// 2. Fix App.tsx load logic
let app = fs.readFileSync('src/App.tsx', 'utf8');
const oldLoad = `        if (data) {
          if (data.layersString) {
            const parsed = JSON.parse(data.layersString) as GisLayer[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLayers(parsed);
              setPublishedLayers(parsed);
              setActiveLayerId(parsed[0].id);
              if (data.publishedAt) {
                setLastPublishedAt(data.publishedAt);
              }
              return;
            }
          }
        }`;

const newLoad = `        if (data) {
          let parsed = null;
          if (data.layersString) {
            try {
              parsed = JSON.parse(data.layersString);
            } catch (e) {
              console.error('Error parsing layersString:', e);
            }
          } else if (data.layers) {
            parsed = data.layers;
          }
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLayers(parsed);
            setPublishedLayers(parsed);
            setActiveLayerId(parsed[0].id);
            if (data.publishedAt) {
              setLastPublishedAt(data.publishedAt);
            }
            return;
          }
        }`;
app = app.replace(oldLoad, newLoad);
fs.writeFileSync('src/App.tsx', app);
console.log('Patch complete.');
