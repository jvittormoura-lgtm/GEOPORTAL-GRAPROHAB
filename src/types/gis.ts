export type AppMode = 'gestor' | 'consumidor';

export interface GraprohabProject {
  processo_graprohab: string;
  nome_empreendimento: string;
  municipio: string;
  regiao_administrativa: string;
  interessado_empreendedor: string;
  tipo_empreendimento: string;
  status_graprohab: 'Aprovado com Certificado' | 'Em Análise Técnica' | 'Com Exigências Técnicas' | 'Dispensado de Análise' | 'Indeferido';
  numero_certificado?: string;
  quantidade_lotes_uh: number;
  area_total_m2: number;
  area_lote_padrao_m2?: number;
  area_preservacao_app_m2?: number;
  area_institucional_sistema_lazer_m2?: number;
  bacia_hidrografica_ugrhi: string;
  orgaos_envolvidos?: string;
  data_protocolo?: string;
  data_deliberacao?: string;
  observacoes?: string;
}

export type GeometryType = 
  | 'Point' 
  | 'MultiPoint' 
  | 'LineString' 
  | 'MultiLineString' 
  | 'Polygon' 
  | 'MultiPolygon' 
  | 'GeometryCollection'
  | 'Mixed';

export interface PropertySchema {
  key: string;
  type: 'number' | 'string' | 'boolean' | 'date' | 'object';
  uniqueValuesCount: number;
  sampleValues: (string | number | boolean)[];
  min?: number;
  max?: number;
}

export type FilterOperator = 
  | '=' 
  | '!=' 
  | '>' 
  | '>=' 
  | '<' 
  | '<=' 
  | 'contains' 
  | 'startsWith' 
  | 'in' 
  | 'between' 
  | 'isNull' 
  | 'isNotNull'
  | 'global_search'
  | 'match_municipio'
  | 'match_empreendedor'
  | 'match_protocolo'
  | 'match_dispensa'
  | 'match_ano_entrada'
  | 'match_status';

export interface AttributeFilter {
  id: string;
  property: string;
  type: 'number' | 'string' | 'boolean' | 'date';
  operator: FilterOperator;
  value: any;
  secondaryValue?: any;
  active: boolean;
}

export interface LayerStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fillOpacity: number;
  strokeOpacity: number;
  pointRadius: number;
  pointShape: 'circle' | 'square' | 'pin';
  smoothFactor?: number;
}

export interface ThematicClass {
  min?: number;
  max?: number;
  value?: string;
  color: string;
  label: string;
  count?: number;
}

export interface ThematicConfig {
  enabled: boolean;
  property: string;
  mode: 'graduated' | 'categorical';
  method: 'quantile' | 'equalInterval' | 'uniqueValues';
  palette: string[];
  classes: ThematicClass[];
}


export interface GisLayer {
  id: string;
  name: string;
  description?: string;
  geometryType: GeometryType;
  data: GeoJSON.FeatureCollection;
  visible: boolean;
  opacity: number;
  style: LayerStyle;
  thematic?: ThematicConfig;
  isHeatmap?: boolean;
  filters: AttributeFilter[];
  featureCount: number;
  filteredCount: number;
  propertiesSchema: PropertySchema[];
  popupFieldOrder?: string[];
  popupVisibleFields?: string[];
  popupTitleField?: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  createdAt: number;
  isRealtime?: boolean;
  realtimeUrl?: string;
  refreshIntervalSeconds?: number;
}

export interface BasemapOption {
  id: string;
  name: string;
  description?: string;
  category: 'light' | 'dark' | 'satellite' | 'terrain' | 'osm' | 'custom';
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  thumbnail?: string;
  requiresKey?: boolean;
}

export type ExportFormat = 'geojson' | 'kml' | 'shp' | 'csv' | 'gpx' | 'github_bundle';

export interface ExportOptions {
  format: ExportFormat;
  layerId: string;
  exportFilteredOnly: boolean;
  fileName: string;
  includeWkt: boolean;
  includeLatLon: boolean;
}

export interface DrawFeature {
  id: string;
  type: 'point' | 'line' | 'polygon';
  coordinates: any;
  properties: Record<string, any>;
}

export interface MeasurementResult {
  type: 'distance' | 'area';
  value: number; // meters or sq meters
  formatted: string;
  points: [number, number][];
}
