const fs = require('fs');
let content = fs.readFileSync('src/components/StyleModal.tsx', 'utf8');

const oldSmooth = `                {(layer.geometryType === 'Polygon' || layer.geometryType === 'MultiPolygon' || layer.geometryType === 'LineString' || layer.geometryType === 'MultiLineString' || layer.geometryType === 'Mixed' || layer.geometryType === 'GeometryCollection') && (
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
                )}`;

const newSmooth = `                {(layer.geometryType === 'Polygon' || layer.geometryType === 'MultiPolygon' || layer.geometryType === 'LineString' || layer.geometryType === 'MultiLineString' || layer.geometryType === 'Mixed' || layer.geometryType === 'GeometryCollection') && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Simplificação (Aproximação)</span>
                      <span className="font-mono text-sky-400">{style.smoothFactor !== undefined ? style.smoothFactor : 1.0}</span>
                    </div>
                    <div className="flex flex-col gap-1 pb-4">
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={style.smoothFactor !== undefined ? style.smoothFactor : 1.0}
                          onChange={(e) => setStyle({ ...style, smoothFactor: parseFloat(e.target.value) })}
                          className="w-full accent-sky-500 h-1.5 bg-slate-700/80 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between w-full mt-1.5 pointer-events-none relative px-0.5">
                          <div className="flex flex-col items-center absolute" style={{ left: '0%', transform: 'translateX(0%)' }}>
                            <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                            <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">Preciso</span>
                          </div>
                          <div className="flex flex-col items-center absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                            <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                            <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">5.0</span>
                          </div>
                          <div className="flex flex-col items-center absolute" style={{ left: '100%', transform: 'translateX(-100%)' }}>
                            <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                            <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">Leve</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Valores maiores aceleram a renderização suavizando as bordas apenas visualmente.</p>
                  </div>
                )}`;

content = content.replace(oldSmooth, newSmooth);
fs.writeFileSync('src/components/StyleModal.tsx', content);
