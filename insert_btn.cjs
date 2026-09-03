const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = '<MapComponent';
const buttonHtml = `
          {/* Toggle Sidebar Button */}
          <button
            id="btn-toggle-sidebar"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-3 right-3 z-[1000] flex flex-col items-center justify-center w-12 h-12 bg-white/90 border border-slate-300/80 rounded-xl text-slate-700 hover:text-red-600 hover:bg-slate-100 shadow-xl backdrop-blur-xs transition-colors"
            title={isSidebarOpen ? 'Recolher Painel' : 'Expandir Painel'}
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4 mb-0.5" /> : <PanelRight className="w-4 h-4 mb-0.5" />}
            <span className="text-[8px] font-bold tracking-widest leading-none">PAINEL</span>
          </button>
          
          <MapComponent`;

code = code.replace(target, buttonHtml);
fs.writeFileSync('src/App.tsx', code);
console.log('Inserted button successfully');
