const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove state declaration
content = content.replace("  const [isDraggingFile, setIsDraggingFile] = useState(false);\n", "");

// 2. Remove handlers from the main div
const oldDiv = `  return (
    <div 
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          requireAuth(() => {
            for (let i = 0; i < files.length; i++) {
              handleLoadGeoJsonFile(files[i]);
            }
          });
        }
      }}
    >`;

const newDiv = `  return (
    <div 
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden"
    >`;

content = content.replace(oldDiv, newDiv);

// 3. Remove Drag & Drop Visual Overlay
const overlayRegex = /\{\/\* Drag & Drop Visual Overlay with Password Protection Hint \*\/\}\s*\{isDraggingFile && \([\s\S]*?\}\s*\)/m;
content = content.replace(overlayRegex, "");

fs.writeFileSync('src/App.tsx', content);
console.log('patched app');
