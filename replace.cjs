const fs = require('fs');
let code = fs.readFileSync('src/components/MapComponent.tsx', 'utf8');

const targetStr = `        <button
          onClick={handleResetExtent}
          className="p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Enquadrar todas as camadas"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>`;

const replacement = `        <button
          onClick={handleResetExtent}
          className="p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Enquadrar todas as camadas"
        >
          <MapPin className="w-4 h-4" />
        </button>
` + fs.readFileSync('/tmp/hud.ts', 'utf8');

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/MapComponent.tsx', code);
  console.log('Replaced successfully');
} else {
  console.log('Target string not found');
}
