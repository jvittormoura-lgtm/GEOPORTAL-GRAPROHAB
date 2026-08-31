import { AttributeFilter, GeometryType, PropertySchema } from '../types/gis';

/**
 * Normalizes text for search and filtering:
 * - Strips diacritics / accents (e.g., 'São Paulo' -> 'sao paulo', 'SÃO JOSÉ' -> 'sao jose')
 * - Converts to lowercase
 * - Collapses whitespace
 * - Handles null / undefined safely
 */
export function normalizeSearchText(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent fuzzy / multi-term search matcher:
 * Checks if target string matches query (supports word-by-word matching)
 */
export function matchSmartSearch(target: any, query: string): boolean {
  if (!query || !query.trim()) return true;
  const normQuery = normalizeSearchText(query);
  const normTarget = normalizeSearchText(target);
  
  if (!normTarget) return false;
  if (normTarget.includes(normQuery)) return true;

  // Multi-term support: all words in search query must appear in target
  const terms = normQuery.split(' ').filter(t => t.length > 0);
  if (terms.length > 1) {
    return terms.every(t => normTarget.includes(t));
  }

  return false;
}

const yearCache = new WeakMap<object, number | null>();

/**
 * Extrai um ano razoável de diversas variações de atributos do GeoJSON com altíssimo desempenho e cache
 */
export function extractYearFromProperties(props: any): number | null {
  if (!props || typeof props !== 'object') return null;
  
  if (yearCache.has(props)) {
    return yearCache.get(props) ?? null;
  }

  // 1. Checagem direta rápida dos campos mais comuns (O(1))
  const directFields = [
    'ANO ENTRADA', 'ANO', 'ano', 'Ano', 'ano_entrada', 'ANO_ENTRADA',
    'DATA DE ENTRADA', 'DATA DO CERTIFICADO', 'data', 'DATA', 'Data',
    'EXPEDIENTE DISPENSA', 'PROTOCOLO', 'expediente_dispensa', 'protocolo'
  ];

  for (const field of directFields) {
    const val = props[field];
    if (val !== undefined && val !== null && val !== '') {
      if (typeof val === 'number' && val >= 1900 && val <= 2100) {
        yearCache.set(props, val);
        return val;
      }
      const str = String(val);
      const match = str.match(/(?:^|[^\d])(19\d{2}|20\d{2})(?:[^\d]|$)/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        yearCache.set(props, parsed);
        return parsed;
      }
    }
  }
  
  // 2. Procurar nas demais chaves como fallback
  for (const key of Object.keys(props)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('ano') || lowerKey.includes('data') || lowerKey.includes('protocolo') || lowerKey.includes('processo') || lowerKey.includes('entrada') || lowerKey.includes('expediente')) {
       const val = props[key];
       if (val !== undefined && val !== null && val !== '') {
         const str = String(val);
         const match = str.match(/(?:^|[^\d])(19\d{2}|20\d{2})(?:[^\d]|$)/);
         if (match) {
           const parsed = parseInt(match[1], 10);
           yearCache.set(props, parsed);
           return parsed;
         }
       }
    }
  }

  yearCache.set(props, null);
  return null;
}

/**
 * Safe numeric parser supporting Brazilian (1.234,56) and standard (1234.56) notation
 */
export function parseNumericValue(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim();
  if (!str) return 0;

  // Strip non-numeric suffixes like m², ha, UH, lotes, etc.
  str = str.replace(/[^\d.,-]/g, '').trim();
  if (!str) return 0;

  // Check if Brazilian format like '1.250,50' or '12.450'
  if (str.includes(',') && str.includes('.')) {
    // 1.250,50 -> 1250.50
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // 1250,50 -> 1250.50
    str = str.replace(',', '.');
  } else if (str.includes('.') && (str.match(/\./g) || []).length > 1) {
    // 1.250.000 -> 1250000
    str = str.replace(/\./g, '');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Extracts "Nº DE LOTES UNIDADES HABITACIONAIS" with high resilience to naming variations
 */
export function extractUhFromProperties(props: any): number {
  if (!props || typeof props !== 'object') return 0;

  // 1. Direct key matches
  const directKeys = [
    'Nº DE UNIDADES HABITACIONAIS',
    'NO DE UNIDADES HABITACIONAIS',
    'N DE UNIDADES HABITACIONAIS',
    'Nº DE LOTES UNIDADES HABITACIONAIS',
    'NO DE LOTES UNIDADES HABITACIONAIS',
    'N DE LOTES UNIDADES HABITACIONAIS',
    'N_DE_LOTES_UNIDADES_HABITACIONAIS',
    'NO_DE_LOTES_UNIDADES_HABITACIONAIS',
    'NUMERO_LOTES_UNIDADES_HABITACIONAIS',
    'NUMERO DE LOTES UNIDADES HABITACIONAIS',
    'quantidade_lotes_uh',
    'QUANTIDADE_LOTES_UH',
    'LOTES_UH',
    'lotes_uh',
    'UH',
    'uh',
    'LOTES',
    'lotes',
    'UNIDADES',
    'unidades',
    'UNIDADES_HABITACIONAIS',
    'unidades_habitacionais',
    'N_LOTES',
    'NO_LOTES',
    'NUM_LOTES',
    'TOTAL_UH'
  ];

  for (const k of directKeys) {
    if (props[k] !== undefined && props[k] !== null && props[k] !== '') {
      const val = parseNumericValue(props[k]);
      if (val > 0) return val;
    }
  }

  // 2. Fuzzy normalized key scan
  const entries = Object.entries(props);
  for (const [key, val] of entries) {
    if (val === null || val === undefined || val === '') continue;
    const normKey = normalizeSearchText(key);

    const hasLoteOrUh = normKey.includes('lote') || normKey.includes('unidade') || normKey.includes('uh') || normKey.includes('habitacion');
    const isCountKey = normKey.includes('no') || normKey.includes('num') || normKey.includes('qtd') || normKey.includes('quant') || normKey.includes('total') || normKey.includes('de');

    if (hasLoteOrUh && (isCountKey || normKey === 'uh' || normKey === 'lotes' || normKey === 'unidades')) {
      const parsed = parseNumericValue(val);
      if (parsed > 0) return parsed;
    }
  }

  return 0;
}

/**
 * Extracts "ÁREA TOTAL DA GLEBA/M²" with resilience to naming variations, with geometric fallback
 */
export function extractAreaM2FromProperties(props: any, feature?: GeoJSON.Feature): number {
  if (props && typeof props === 'object') {
    // 1. Direct key matches
    const directKeys = [
      'ÁREA TOTAL DA GLEBA/M²',
      'AREA TOTAL DA GLEBA/M²',
      'ÁREA TOTAL DA GLEBA / M²',
      'AREA TOTAL DA GLEBA / M²',
      'AREA_TOTAL_DA_GLEBA_M2',
      'AREA_TOTAL_GLEBA_M2',
      'AREA_GLEBA_M2',
      'area_gleba_m2',
      'AREA_TOTAL_M2',
      'area_total_m2',
      'AREA_TOTAL',
      'area_total',
      'AREA_GLEBA',
      'area_gleba',
      'AREA_M2',
      'area_m2',
      'Área (m²)',
      'AREA (M2)',
      'AREA',
      'area'
    ];

    for (const k of directKeys) {
      if (props[k] !== undefined && props[k] !== null && props[k] !== '') {
        const val = parseNumericValue(props[k]);
        if (val > 0) return val;
      }
    }

    // 2. Fuzzy normalized key scan
    const entries = Object.entries(props);
    for (const [key, val] of entries) {
      if (val === null || val === undefined || val === '') continue;
      const normKey = normalizeSearchText(key);

      const hasAreaOrGleba = normKey.includes('area') || normKey.includes('gleba');
      const isTotalOrM2 = normKey.includes('total') || normKey.includes('m2') || normKey.includes('gleba');

      if (hasAreaOrGleba && isTotalOrM2) {
        const parsed = parseNumericValue(val);
        if (parsed > 0) return parsed;
      }
    }
  }

  // 3. Fallback: compute geodesic polygonal area from geometry if available
  if (feature && feature.geometry) {
    const geoArea = calculateFeatureArea(feature);
    if (geoArea > 0) return geoArea;
  }

  return 0;
}

/**
 * Computes aggregate summary metrics from a set of features
 */
export function extractFeaturesMetrics(features: GeoJSON.Feature[]) {
  let totalUh = 0;
  let totalAreaM2 = 0;
  let approvedCount = 0;
  let analysisCount = 0;

  features.forEach(f => {
    const p = f.properties || {};
    totalUh += extractUhFromProperties(p);
    totalAreaM2 += extractAreaM2FromProperties(p, f);

    const statusNorm = normalizeSearchText(p.status_graprohab || p.status || p.STATUS || '');
    if (statusNorm.includes('aprovad') || statusNorm.includes('certificad')) {
      approvedCount++;
    } else if (statusNorm.includes('analise') || statusNorm.includes('exigencia') || statusNorm.includes('tramit')) {
      analysisCount++;
    }
  });

  return {
    totalProjects: features.length,
    totalUh,
    totalAreaM2,
    totalHectares: (totalAreaM2 / 10000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
    approvedCount,
    analysisCount
  };
}

export function parseGeoJson(rawContent: string | object): GeoJSON.FeatureCollection {
  let parsed: any;
  if (typeof rawContent === 'string') {
    try {
      parsed = JSON.parse(rawContent);
    } catch (e: any) {
      throw new Error(`Arquivo GeoJSON inválido: formato JSON corrompido (${e.message})`);
    }
  } else {
    parsed = rawContent;
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Conteúdo GeoJSON inválido.');
  }

  if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
    return parsed as GeoJSON.FeatureCollection;
  }

  if (parsed.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [parsed]
    };
  }

  if (parsed.type && ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'].includes(parsed.type)) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: parsed,
          properties: {}
        }
      ]
    };
  }

  throw new Error('O arquivo não contém uma estrutura GeoJSON válida (FeatureCollection, Feature ou Geometry).');
}

export function detectGeometryType(features: GeoJSON.Feature[]): GeometryType {
  if (!features || features.length === 0) return 'Polygon';
  
  const types = new Set<string>();
  features.forEach(f => {
    if (f && f.geometry && f.geometry.type) {
      types.add(f.geometry.type);
    }
  });

  if (types.size === 0) return 'Polygon';
  
  const typeArr = Array.from(types);

  // Single type
  if (typeArr.length === 1) {
    const single = typeArr[0];
    if (single === 'MultiPolygon' || single === 'Polygon') return 'Polygon';
    if (single === 'MultiLineString' || single === 'LineString') return 'LineString';
    if (single === 'MultiPoint' || single === 'Point') return 'Point';
    return single as GeometryType;
  }

  // Polygons (Polygon or MultiPolygon)
  const allPolys = typeArr.every(t => t === 'Polygon' || t === 'MultiPolygon');
  if (allPolys) return 'Polygon';

  // Lines
  const allLines = typeArr.every(t => t === 'LineString' || t === 'MultiLineString');
  if (allLines) return 'LineString';

  // Points
  const allPoints = typeArr.every(t => t === 'Point' || t === 'MultiPoint');
  if (allPoints) return 'Point';

  return 'Mixed';
}

export function calculateBoundingBox(features: GeoJSON.Feature[]): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function traverse(coords: any) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lng = coords[0];
      const lat = coords[1];
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
      return;
    }
    for (let i = 0; i < coords.length; i++) {
      traverse(coords[i]);
    }
  }

  features.forEach(f => {
    if (f.geometry && 'coordinates' in f.geometry) {
      traverse((f.geometry as any).coordinates);
    }
  });

  if (minLng === Infinity || minLat === Infinity) {
    return [-180, -90, 180, 90];
  }

  // Add small padding if single point
  if (minLng === maxLng) {
    minLng -= 0.05;
    maxLng += 0.05;
  }
  if (minLat === maxLat) {
    minLat -= 0.05;
    maxLat += 0.05;
  }

  return [minLng, minLat, maxLng, maxLat];
}

export function extractPropertySchemas(features: GeoJSON.Feature[]): PropertySchema[] {
  const map = new Map<string, {
    values: any[];
    types: Set<string>;
    min?: number;
    max?: number;
  }>();

  features.forEach(f => {
    const props = f.properties || {};
    Object.entries(props).forEach(([key, val]) => {
      if (!map.has(key)) {
        map.set(key, { values: [], types: new Set() });
      }
      const entry = map.get(key)!;
      if (val !== null && val !== undefined) {
        entry.values.push(val);
        const t = typeof val;
        if (t === 'number') {
          entry.types.add('number');
          if (entry.min === undefined || val < entry.min) entry.min = val;
          if (entry.max === undefined || val > entry.max) entry.max = val;
        } else if (t === 'boolean') {
          entry.types.add('boolean');
        } else if (t === 'string') {
          entry.types.add('string');
        } else if (t === 'object') {
          entry.types.add('object');
        }
      }
    });
  });

  const schemas: PropertySchema[] = [];
  map.forEach((data, key) => {
    let mainType: PropertySchema['type'] = 'string';
    if (data.types.has('number') && data.types.size === 1) {
      mainType = 'number';
    } else if (data.types.has('boolean') && data.types.size === 1) {
      mainType = 'boolean';
    } else if (data.types.has('object')) {
      mainType = 'object';
    }

    const uniqueSet = new Set(data.values);
    const sampleValues = Array.from(uniqueSet).slice(0, 10);

    schemas.push({
      key,
      type: mainType,
      uniqueValuesCount: uniqueSet.size,
      sampleValues,
      min: data.min,
      max: data.max
    });
  });

  return schemas.sort((a, b) => a.key.localeCompare(b.key));
}

export function filterFeatures(
  features: GeoJSON.Feature[],
  filters: AttributeFilter[]
): GeoJSON.Feature[] {
  if (!filters || filters.length === 0) {
    return features;
  }

  const activeFilters = (filters || []).filter(f => f.active);

  return features.filter(f => {
    const props = f.properties || {};

    // 1. Attribute filtering
    for (const filter of activeFilters) {
      if (filter.operator === 'global_search') {
        const propValues = Object.values(props).filter(v => v !== null && v !== undefined).map(String);
        const matches = propValues.some(v => matchSmartSearch(v, String(filter.value)));
        if (!matches) return false;
        continue;
      }

      if (filter.operator === 'match_municipio') {
        const featMun = props.municipio || props.MUNICIPIO || props.cidade || props.CIDADE || props.Municipio || '';
        if (normalizeSearchText(String(featMun)) !== normalizeSearchText(String(filter.value))) return false;
        continue;
      }

      if (filter.operator === 'match_empreendedor') {
        const rawEmp = props.PROPRIETARIO ?? props.proprietario ?? props.Proprietario ?? '';
        if (!matchSmartSearch(String(rawEmp), String(filter.value))) return false;
        continue;
      }

      if (filter.operator === 'match_protocolo') {
        const rawProt = props.PROTOCOLO ?? props.protocolo ?? props.Protocolo ?? '';
        if (!matchSmartSearch(String(rawProt), String(filter.value))) return false;
        continue;
      }

      if (filter.operator === 'match_dispensa') {
        const rawDisp = props.expediente_dispensa ?? props.dispensa ?? props.DISPENSA ?? props['Expediente Dispensa'] ?? props['EXPEDIENTE DISPENSA'] ?? '';
        if (!matchSmartSearch(String(rawDisp), String(filter.value))) return false;
        continue;
      }

      if (filter.operator === 'match_ano_entrada') {
        const numAno = extractYearFromProperties(props);
        const [min, max] = filter.value as [number, number];
        if (numAno === null) return false;
        if (numAno < min || numAno > max) return false;
        continue;
      }

      let val = props[filter.property];
      
      // Fallback for inconsistent casing across shapefiles
      if (val === undefined) {
        const lowerProp = filter.property.toLowerCase();
        const foundKey = Object.keys(props).find(k => k.toLowerCase() === lowerProp);
        if (foundKey) {
          val = props[foundKey];
        }
      }

      if (filter.operator === 'isNull') {
        if (val !== null && val !== undefined && val !== '') return false;
        continue;
      }
      if (filter.operator === 'isNotNull') {
        if (val === null || val === undefined || val === '') return false;
        continue;
      }

      if (val === null || val === undefined) {
        return false;
      }

      if (filter.type === 'number') {
        const numVal = Number(val);
        const filterVal = Number(filter.value);
        if (isNaN(numVal)) return false;

        switch (filter.operator) {
          case '=': if (numVal !== filterVal) return false; break;
          case '!=': if (numVal === filterVal) return false; break;
          case '>': if (numVal <= filterVal) return false; break;
          case '>=': if (numVal < filterVal) return false; break;
          case '<': if (numVal >= filterVal) return false; break;
          case '<=': if (numVal > filterVal) return false; break;
          case 'between': {
            const secVal = Number(filter.secondaryValue);
            if (numVal < filterVal || numVal > secVal) return false;
            break;
          }
        }
      } else if (filter.type === 'string') {
        const normVal = normalizeSearchText(val);
        const normFilterVal = normalizeSearchText(filter.value);

        switch (filter.operator) {
          case '=': if (normVal !== normFilterVal) return false; break;
          case '!=': if (normVal === normFilterVal) return false; break;
          case 'contains': {
            if (!matchSmartSearch(val, String(filter.value))) return false;
            break;
          }
          case 'startsWith': if (!normVal.startsWith(normFilterVal)) return false; break;
          case 'in': {
            const list = Array.isArray(filter.value) 
              ? filter.value.map(v => normalizeSearchText(v)) 
              : normFilterVal.split(',').map(s => s.trim());
            if (!list.includes(normVal)) return false;
            break;
          }
        }
      } else if (filter.type === 'boolean') {
        const bVal = Boolean(val);
        const bFilter = filter.value === true || filter.value === 'true';
        if (bVal !== bFilter) return false;
      }
    }

    return true;
  });
}

export function calculateFeatureArea(input: GeoJSON.Geometry | GeoJSON.Feature | null | undefined): number {
  if (!input) return 0;
  const geom: GeoJSON.Geometry = (input as any).type === 'Feature' ? (input as GeoJSON.Feature).geometry : (input as GeoJSON.Geometry);
  if (!geom) return 0;
  // Approximate geodesic area in sq meters
  if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') return 0;

  const R = 6378137; // WGS84 major radius
  function ringArea(coords: number[][]): number {
    if (coords.length < 3) return 0;
    let total = 0;
    for (let i = 0; i < coords.length; i++) {
      const p1 = coords[i];
      const p2 = coords[(i + 1) % coords.length];
      const lon1 = (p1[0] * Math.PI) / 180;
      const lat1 = (p1[1] * Math.PI) / 180;
      const lon2 = (p2[0] * Math.PI) / 180;
      const lat2 = (p2[1] * Math.PI) / 180;
      total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs((total * R * R) / 2);
  }

  if (geom.type === 'Polygon') {
    let area = ringArea(geom.coordinates[0]);
    for (let i = 1; i < geom.coordinates.length; i++) {
      area -= ringArea(geom.coordinates[i]);
    }
    return Math.max(0, area);
  } else if (geom.type === 'MultiPolygon') {
    return geom.coordinates.reduce((sum, poly) => {
      let area = ringArea(poly[0]);
      for (let i = 1; i < poly.length; i++) {
        area -= ringArea(poly[i]);
      }
      return sum + Math.max(0, area);
    }, 0);
  }

  return 0;
}
