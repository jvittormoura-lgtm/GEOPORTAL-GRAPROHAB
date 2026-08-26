const fs = require('fs');
let content = fs.readFileSync('src/components/LayerManager.tsx', 'utf8');

const sliderComponent = `
const DebouncedSlider = ({
  label, value, min, max, step, onChange, formatValue, rulerMarks, title
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (val: number) => void;
  formatValue: (val: number) => string;
  rulerMarks?: { value: number; label: string }[];
  title?: string;
}) => {
  const [localVal, setLocalVal] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = (newVal: number) => {
    setLocalVal(newVal);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newVal);
    }, 250);
  };

  const handlePointerUp = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onChange(localVal);
  };

  return (
    <div className="mt-3 flex items-start gap-2 px-1" title={title} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
      <span className="text-[10px] text-slate-400 w-14 mt-0.5">{label}:</span>
      <div className="flex-1 flex flex-col">
        <input
          type="range"
          min={min} max={max} step={step}
          value={localVal}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          onPointerUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          className="w-full accent-sky-500 h-1.5 bg-slate-700/80 rounded-lg cursor-pointer"
        />
        {rulerMarks && (
          <div className="flex justify-between w-full mt-1.5 pointer-events-none relative px-0.5">
            {rulerMarks.map((mark, i) => (
              <div key={i} className="flex flex-col items-center absolute" style={{ left: \`\${((mark.value - min) / (max - min)) * 100}%\`, transform: 'translateX(-50%)' }}>
                <div className="h-1 w-[1px] bg-slate-500/40 mb-[1px]"></div>
                <span className="text-[8px] text-slate-500 font-mono leading-none whitespace-nowrap">{mark.label}</span>
              </div>
            ))}
            <div className="h-3 w-full" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-mono text-slate-300 w-8 text-right mt-0.5">
        {formatValue(localVal)}
      </span>
    </div>
  );
};

`;

content = content.replace('export const LayerManager', sliderComponent + 'export const LayerManager');

const oldOpacityAndSmooth = `                  {/* Opacity Slider */}
                  <div className="mt-3 flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-400 w-12">Opacidade:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full accent-sky-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-300 w-7 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>

                  {/* Smooth Factor Slider (Gestor Only) */}
                  {appMode === 'gestor' && onChangeSmoothFactor && 
                   (layer.geometryType !== 'Point' && layer.geometryType !== 'MultiPoint') && (
                    <div className="mt-2 flex items-center gap-2 px-1" title="Simplificação do polígono/linha (quanto maior, mais leve e menos preciso)">
                      <span className="text-[10px] text-slate-400 w-12">Simplificar:</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0}
                        onChange={(e) => onChangeSmoothFactor(layer.id, parseFloat(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full accent-sky-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-300 w-7 text-right">
                        {layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0}
                      </span>
                    </div>
                  )}`;

const newOpacityAndSmooth = `                  {/* Opacity Slider */}
                  <DebouncedSlider
                    label="Opacidade"
                    value={layer.opacity}
                    min={0} max={1} step={0.05}
                    onChange={(v) => onChangeOpacity(layer.id, v)}
                    formatValue={(v) => Math.round(v * 100) + '%'}
                    rulerMarks={[
                      { value: 0, label: '0%' },
                      { value: 0.5, label: '50%' },
                      { value: 1, label: '100%' }
                    ]}
                  />

                  {/* Smooth Factor Slider (Gestor Only) */}
                  {appMode === 'gestor' && onChangeSmoothFactor && 
                   (layer.geometryType !== 'Point' && layer.geometryType !== 'MultiPoint') && (
                    <DebouncedSlider
                      label="Simplificar"
                      title="Simplificação do polígono/linha (quanto maior, mais leve e menos preciso)"
                      value={layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0}
                      min={0} max={10} step={0.5}
                      onChange={(v) => onChangeSmoothFactor(layer.id, v)}
                      formatValue={(v) => v.toFixed(1)}
                      rulerMarks={[
                        { value: 0, label: 'Preciso' },
                        { value: 5, label: '5.0' },
                        { value: 10, label: 'Leve' }
                      ]}
                    />
                  )}`;

content = content.replace(oldOpacityAndSmooth, newOpacityAndSmooth);

fs.writeFileSync('src/components/LayerManager.tsx', content);
console.log('Patched LayerManager sliders');
