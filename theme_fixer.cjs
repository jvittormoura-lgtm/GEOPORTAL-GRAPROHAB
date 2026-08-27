const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix lingering dark colors
      content = content.replace(/bg-sky-950/g, 'bg-red-50');
      content = content.replace(/text-emerald-300/g, 'text-emerald-700');
      content = content.replace(/bg-emerald-950\/60/g, 'bg-emerald-50');
      content = content.replace(/bg-emerald-600\/20/g, 'bg-emerald-100');
      content = content.replace(/bg-emerald-600\/30/g, 'bg-emerald-200');
      content = content.replace(/border-emerald-500\/40/g, 'border-emerald-200');
      content = content.replace(/shadow-emerald-900\/50/g, 'shadow-emerald-200');
      content = content.replace(/shadow-emerald-950/g, 'shadow-emerald-200');
      
      content = content.replace(/bg-rose-950\/40/g, 'bg-rose-50');
      content = content.replace(/bg-rose-900\/50/g, 'bg-rose-100');
      content = content.replace(/text-rose-300/g, 'text-rose-700');
      content = content.replace(/border-rose-500\/40/g, 'border-rose-200');
      
      content = content.replace(/shadow-sky-950/g, 'shadow-red-200');
      content = content.replace(/shadow-purple-950/g, 'shadow-purple-200');
      content = content.replace(/shadow-amber-900\/50/g, 'shadow-amber-200');
      
      // Check for buttons with text-slate-900 that should be text-white
      // For any bg-red-600, bg-red-700, bg-emerald-500, bg-emerald-600, bg-purple-500, bg-purple-600, bg-amber-500
      const coloredBgRegex = /className="[^"]*(bg-red-500|bg-red-600|bg-red-700|bg-emerald-500|bg-emerald-600|bg-purple-500|bg-purple-600|bg-amber-500|bg-amber-600|bg-[a-z]+-600)[^"]*"/g;
      content = content.replace(coloredBgRegex, (match) => {
        // Only if it's a solid background (not bg-opacity like bg-red-600/20)
        // Actually, easiest is just replacing text-slate-900 with text-white if there is a strong bg
        return match.replace(/text-slate-900/g, 'text-white').replace(/text-slate-800/g, 'text-white').replace(/text-slate-700/g, 'text-white');
      });

      // Fix bg-slate-950 which is now bg-slate-50
      // wait, the app background in map might be white or slate-50
      
      // Fix gradients
      content = content.replace(/from-red-700 via-blue-600 to-indigo-600/g, 'from-red-600 to-red-400');
      content = content.replace(/from-red-700 to-blue-600/g, 'from-red-600 to-red-500');
      content = content.replace(/hover:to-blue-500/g, 'hover:to-red-400');

      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}

processDirectory(directoryPath);
console.log('Theme fixes applied successfully');
