const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Imports
app = app.replace("import { db } from './lib/firebase';\nimport { doc, getDoc, setDoc } from 'firebase/firestore';\nimport { saveLargeDocument, loadLargeDocument } from './lib/firebaseUtils';", "import localforage from 'localforage';");

// 2. loadFromCloud
const oldLoad = `  // Load published layers from Firestore or initialize with GRAPROHAB SP default
  useEffect(() => {
    const loadFromCloud = async () => {
      try {
        const data = await loadLargeDocument('published_layers', 'main_config');
        
        if (data) {
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
        }
      } catch (err) {
        console.warn('Erro ao carregar dados salvos na nuvem:', err);
      }
      
      // Default Fallback
      const defaultSample = SAMPLE_DATASETS[0]; // Empreendimentos Habitacionais GRAPROHAB - SP
      const initialLayer = createLayerFromGeoJson(defaultSample.title, defaultSample.data);
      setLayers([initialLayer]);
      setPublishedLayers([initialLayer]);
      setActiveLayerId(initialLayer.id);
    };
    
    loadFromCloud();
  }, []);`;

const newLoad = `  // Load published layers from local storage or initialize with GRAPROHAB SP default
  useEffect(() => {
    const loadFromLocal = async () => {
      try {
        const storedLayers = await localforage.getItem<GisLayer[]>('graprohab_layers');
        const storedTime = await localforage.getItem<number>('graprohab_published_at');
        
        if (storedLayers && Array.isArray(storedLayers) && storedLayers.length > 0) {
          setLayers(storedLayers);
          setPublishedLayers(storedLayers);
          setActiveLayerId(storedLayers[0].id);
          if (storedTime) {
            setLastPublishedAt(storedTime);
          }
          return;
        }
      } catch (err) {
        console.warn('Erro ao carregar dados salvos localmente:', err);
      }
      
      // Default Fallback
      const defaultSample = SAMPLE_DATASETS[0]; // Empreendimentos Habitacionais GRAPROHAB - SP
      const initialLayer = createLayerFromGeoJson(defaultSample.title, defaultSample.data);
      setLayers([initialLayer]);
      setPublishedLayers([initialLayer]);
      setActiveLayerId(initialLayer.id);
    };
    
    loadFromLocal();
  }, []);`;
app = app.replace(oldLoad, newLoad);

// 3. handlePublishToPublic
const oldPublish = `  // Publish changes from Gestor (draft) to Consumidor (citizen)
  const handlePublishToPublic = async () => {
    const publishedCopy = JSON.parse(JSON.stringify(layers));
    setPublishedLayers(publishedCopy);
    setHasUnpublishedChanges(false);
    const now = Date.now();
    setLastPublishedAt(now);
    
    showToast('Salvando na nuvem...');
    try {
      await saveLargeDocument('published_layers', 'main_config', JSON.stringify(publishedCopy), { publishedAt: now });
      showToast('Camadas e dados publicados com sucesso na nuvem!', 'success');
    } catch (e) {
      console.error('Falha ao salvar no Firestore:', e);
      showToast('Erro ao publicar na nuvem. Verifique o console.', 'error');
    }
  };`;

const newPublish = `  // Publish changes from Gestor (draft) to Consumidor (citizen)
  const handlePublishToPublic = async () => {
    const publishedCopy = JSON.parse(JSON.stringify(layers));
    setPublishedLayers(publishedCopy);
    setHasUnpublishedChanges(false);
    const now = Date.now();
    setLastPublishedAt(now);
    
    showToast('Salvando alterações...');
    try {
      await localforage.setItem('graprohab_layers', publishedCopy);
      await localforage.setItem('graprohab_published_at', now);
      showToast('Camadas e dados publicados com sucesso!', 'success');
    } catch (e) {
      console.error('Falha ao salvar no localforage:', e);
      showToast('Erro ao publicar. Verifique o console.', 'error');
    }
  };`;
app = app.replace(oldPublish, newPublish);

fs.writeFileSync('src/App.tsx', app);
console.log('App patched!');
