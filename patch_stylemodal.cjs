const fs = require('fs');
let content = fs.readFileSync('src/components/StyleModal.tsx', 'utf8');

const oldState = `    pointRadius: 7,
    pointShape: 'circle'
  });`;
const newState = `    pointRadius: 7,
    pointShape: 'circle',
    smoothFactor: 1.0
  });`;
content = content.replace(oldState, newState);

const oldUseEffect = `  React.useEffect(() => {
    if (layer) {
      setStyle(layer.style);`;
const newUseEffect = `  React.useEffect(() => {
    if (layer) {
      setStyle({
        ...layer.style,
        smoothFactor: layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0
      });`;
content = content.replace(oldUseEffect, newUseEffect);


const oldSliders = `                {layer.geometryType === 'Point' && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Raio do Marcador (Pontos)</span>
                      <span className="font-mono text-sky-400">{style.pointRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="25"
                      step="1"
                      value={style.pointRadius}
                      onChange={(e) => setStyle({ ...style, pointRadius: parseInt(e.target.value) })}
                      className="w-full accent-sky-500"
                    />
                  </div>
                )}
              </div>
            </div>`;

const newSliders = `                {layer.geometryType === 'Point' && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Raio do Marcador (Pontos)</span>
                      <span className="font-mono text-sky-400">{style.pointRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="25"
                      step="1"
                      value={style.pointRadius}
                      onChange={(e) => setStyle({ ...style, pointRadius: parseInt(e.target.value) })}
                      className="w-full accent-sky-500"
                    />
                  </div>
                )}

                {(layer.geometryType === 'Polygon' || layer.geometryType === 'MultiPolygon' || layer.geometryType === 'LineString' || layer.geometryType === 'MultiLineString' || layer.geometryType === 'Mixed' || layer.geometryType === 'GeometryCollection') && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Simplificação (Aproximação)</span>
                      <span className="font-mono text-sky-400">{style.smoothFactor !== undefined ? style.smoothFactor : 1.0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12 text-right">Preciso</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={style.smoothFactor !== undefined ? style.smoothFactor : 1.0}
                        onChange={(e) => setStyle({ ...style, smoothFactor: parseFloat(e.target.value) })}
                        className="w-full accent-sky-500"
                      />
                      <span className="text-[10px] text-slate-500 w-12">Leve</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Valores maiores aceleram a renderização suavizando as bordas apenas visualmente.</p>
                  </div>
                )}
              </div>
            </div>`;
content = content.replace(oldSliders, newSliders);

fs.writeFileSync('src/components/StyleModal.tsx', content);
console.log('patched StyleModal');
