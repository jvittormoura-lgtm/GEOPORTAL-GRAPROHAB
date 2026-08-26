const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
app = app.replace(
  "import { doc, getDoc, setDoc } from 'firebase/firestore';",
  "import { doc, getDoc, setDoc } from 'firebase/firestore';\nimport { saveLargeDocument, loadLargeDocument } from './lib/firebaseUtils';"
);

// Modify loadFromCloud
const oldLoad = `        const docRef = doc(db, 'published_layers', 'main_config');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();`;
const newLoad = `        const data = await loadLargeDocument('published_layers', 'main_config');
        
        if (data) {`;
app = app.replace(oldLoad, newLoad);

// Modify handlePublishToPublic
const oldSave = `    try {
      await setDoc(doc(db, 'published_layers', 'main_config'), {
        layersString: JSON.stringify(publishedCopy),
        publishedAt: now
      });
      showToast('Camadas e dados publicados com sucesso na nuvem!', 'success');`;

const newSave = `    try {
      await saveLargeDocument('published_layers', 'main_config', JSON.stringify(publishedCopy), { publishedAt: now });
      showToast('Camadas e dados publicados com sucesso na nuvem!', 'success');`;
      
app = app.replace(oldSave, newSave);

fs.writeFileSync('src/App.tsx', app);
console.log('App patched!');
