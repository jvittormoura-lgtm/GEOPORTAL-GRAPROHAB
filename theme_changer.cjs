const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds
  { regex: /bg-slate-950/g, replacement: 'bg-slate-50' },
  { regex: /bg-slate-900/g, replacement: 'bg-white' },
  { regex: /bg-slate-800/g, replacement: 'bg-slate-100' },
  { regex: /bg-slate-700/g, replacement: 'bg-slate-200' },
  { regex: /bg-slate-600/g, replacement: 'bg-slate-300' },
  
  // Text Colors
  { regex: /text-slate-100/g, replacement: 'text-slate-900' },
  { regex: /text-slate-200/g, replacement: 'text-slate-800' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500' },
  
  // Borders
  { regex: /border-slate-800/g, replacement: 'border-slate-200' },
  { regex: /border-slate-700/g, replacement: 'border-slate-300' },
  { regex: /border-slate-600/g, replacement: 'border-slate-300' },
  { regex: /divide-slate-800/g, replacement: 'divide-slate-200' },
  { regex: /ring-slate-800/g, replacement: 'ring-slate-200' },

  // Accents (Sky -> Red)
  { regex: /sky-300/g, replacement: 'red-500' },
  { regex: /sky-400/g, replacement: 'red-600' },
  { regex: /sky-500/g, replacement: 'red-600' },
  { regex: /sky-600/g, replacement: 'red-700' },
  { regex: /sky-900/g, replacement: 'red-100' },

  // Special Gradients & overrides
  { regex: /from-sky-900\/20/g, replacement: 'from-red-100/50' },
  { regex: /to-slate-950/g, replacement: 'to-slate-50' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Apply general replacements
      replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });
      
      // Contextual replacements for text-white
      // If text-white is inside a button with bg-red-600/700, keep it. 
      // If it's a general title text-white, make it text-slate-900.
      // We can just replace all text-white that are NOT preceded/followed by bg-red- or bg-sky- or other dark button bgs.
      // Easiest is to replace text-white with text-slate-900, but revert it if it's on a colored background or 'bg-slate-900' (which is now bg-white, wait no, if it's a button it should have text-slate-700 now).
      // Let's replace text-white with text-slate-900
      content = content.replace(/text-white/g, 'text-slate-900');
      
      // But fix buttons that use bg-red-600 or bg-red-700 or bg-indigo-500 or bg-emerald-500 or bg-rose-500
      // Find classes with both bg-(color) and text-slate-900, change text-slate-900 back to text-white
      const coloredBgRegex = /className="[^"]*(bg-red-|bg-indigo-|bg-emerald-|bg-rose-|bg-amber-|bg-green-)[^"]*"/g;
      content = content.replace(coloredBgRegex, (match) => {
        return match.replace(/text-slate-900/g, 'text-white');
      });

      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}

processDirectory(directoryPath);
console.log('Theme changed successfully');
