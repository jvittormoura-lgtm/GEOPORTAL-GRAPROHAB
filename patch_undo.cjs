const fs = require('fs');
let content = fs.readFileSync('src/components/BasemapSelector.tsx', 'utf8');

const insertionPoint1 = `  if (!isOpen) return null;`;
const insert1 = `  if (!isOpen) return null;

  const handleApplyCustomMapbox = () => {
    if (!mapboxToken) return;
    const mapboxBasemap: BasemapOption = {
      id: 'mapbox_custom',
      name: \`Mapbox (\${mapboxStyleId})\`,
      category: 'custom',
      url: \`https://api.mapbox.com/styles/v1/\${mapboxStyleId}/tiles/256/{z}/{x}/{y}@2x?access_token=\${mapboxToken}\`,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
      requiresKey: true
    };
    onSelectBasemap(mapboxBasemap);
    onClose();
  };

  const handleApplyCustomXyz = () => {
    if (!customUrl) return;
    const customBasemap: BasemapOption = {
      id: 'xyz_custom_' + Date.now(),
      name: 'Camada XYZ Customizada',
      category: 'custom',
      url: customUrl,
      attribution: '&copy; Camada Personalizada do Usuário',
      maxZoom: 19
    };
    onSelectBasemap(customBasemap);
    onClose();
  };`;
content = content.replace(insertionPoint1, insert1);

const insertionPoint2 = `          </div>
        {/* Footer */}`;
const insert2 = `          {/* Mapbox Integration */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
              <Key className="w-4 h-4" />
              <span>Integração Mapbox API (Opcional)</span>
            </div>
            <p className="text-xs text-slate-400">
              Caso possua seu próprio Access Token do Mapbox e estilo customizado (ex: <code>mapbox/outdoors-v12</code> ou <code>mapbox/satellite-streets-v12</code>), insira abaixo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="password"
                placeholder="Mapbox Access Token (pk.eyJ1...)"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <input
                type="text"
                placeholder="Estilo (ex: mapbox/streets-v12)"
                value={mapboxStyleId}
                onChange={(e) => setMapboxStyleId(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              onClick={handleApplyCustomMapbox}
              disabled={!mapboxToken}
              className="w-full py-2 bg-amber-600/80 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition-colors"
            >
              Aplicar Estilo Mapbox
            </button>
          </div>

          {/* Custom XYZ Tile URL */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Globe className="w-4 h-4" />
              <span>URL de Servidor de Tiles XYZ / TMS Personalizado</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://meu-servidor-gis.com/tiles/{z}/{x}/{y}.png"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleApplyCustomXyz}
                disabled={!customUrl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Carregar XYZ
              </button>
            </div>
          </div>
        </div>
        {/* Footer */}`;
content = content.replace(insertionPoint2, insert2);

fs.writeFileSync('src/components/BasemapSelector.tsx', content);
console.log('Restored mapbox and xyz inputs');
