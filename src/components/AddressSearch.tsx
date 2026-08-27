import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Map } from 'lucide-react';

interface AddressSearchProps {
  onFlyTo: (lat: number, lon: number, bbox?: [number, number, number, number]) => void;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({ onFlyTo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanding
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close dropdown or collapse search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (!query.trim()) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Prioritize Brazil and SP for better relevance in this context
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5`);
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch (err) {
      console.error('Geocoder error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    let bbox: [number, number, number, number] | undefined;
    if (result.boundingbox) {
      bbox = [
        parseFloat(result.boundingbox[0]), // lat min
        parseFloat(result.boundingbox[1]), // lat max
        parseFloat(result.boundingbox[2]), // lon min
        parseFloat(result.boundingbox[3])  // lon max
      ];
    }
    
    onFlyTo(lat, lon, bbox);
    setQuery(result.display_name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`absolute top-3 left-16 sm:left-3 z-[1000] transition-all duration-300 ease-in-out ${isExpanded ? 'w-64 sm:w-80' : 'w-auto'}`}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center gap-2 p-2.5 bg-white/90 border border-slate-300/80 rounded-xl text-slate-700 hover:text-red-600 hover:bg-slate-100 shadow-xl backdrop-blur-xs transition-colors"
          title="Buscar endereço ou local"
        >
          <Search className="w-4 h-4" />
          <Map className="w-4 h-4" />
        </button>
      ) : (
        <form onSubmit={handleSearch} className="relative flex items-center h-11">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() === '') {
                setIsOpen(false);
              }
            }}
            placeholder="Buscar endereço ou local..."
            className="w-full h-full bg-white/90 border border-slate-300/80 rounded-xl py-2 pl-10 pr-20 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 shadow-xl backdrop-blur-xs transition-all"
          />
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          
          <div className="absolute right-1.5 flex items-center gap-1">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                title="Fechar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="p-1.5 bg-red-700 hover:bg-red-600 disabled:bg-slate-200/50 disabled:text-slate-500 text-white rounded-lg transition-colors"
              title="Buscar"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      )}

      {isOpen && results.length > 0 && isExpanded && (
        <div className="mt-2 w-full bg-white/95 border border-slate-300 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
          <div className="max-h-64 overflow-y-auto p-1">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left p-2.5 hover:bg-slate-100/80 rounded-lg flex gap-2.5 items-start transition-colors group"
              >
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 group-hover:text-red-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[13px] text-slate-800 leading-tight">
                    {r.display_name.split(',')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {r.display_name.split(',').slice(1).join(',')}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="p-1.5 bg-slate-50/50 border-t border-slate-200 text-center">
            <span className="text-[9px] text-slate-600">Resultados por OpenStreetMap</span>
          </div>
        </div>
      )}
      
      {isOpen && results.length === 0 && !isSearching && query.trim() !== '' && isExpanded && (
        <div className="mt-2 p-3 w-full bg-white/95 border border-slate-300 rounded-xl shadow-2xl backdrop-blur-md text-center">
          <span className="text-sm text-slate-500">Nenhum resultado encontrado.</span>
        </div>
      )}
    </div>
  );
}
