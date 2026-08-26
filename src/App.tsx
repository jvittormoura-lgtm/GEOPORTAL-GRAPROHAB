/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { 
  GisLayer, BasemapOption, LayerStyle, ThematicConfig, 
  AttributeFilter, SpatialFilter, AppMode 
} from './types/gis';
import { BASEMAPS, BasemapSelector } from './components/BasemapSelector';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { LayerManager } from './components/LayerManager';
import { FilterPanel } from './components/FilterPanel';
import { StyleModal } from './components/StyleModal';
import { AttributeTable } from './components/AttributeTable';
import { FieldManagerModal } from './components/FieldManagerModal';
import { FeatureInspectorModal } from './components/FeatureInspectorModal';
import { ExportModal } from './components/ExportModal';
import { AiGisModal } from './components/AiGisModal';
import { AuthModal } from './components/AuthModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ConsumerPortal } from './components/ConsumerPortal';
import { SAMPLE_DATASETS } from './utils/sampleDatasets';
import { 
  parseGeoJson, detectGeometryType, calculateBoundingBox, 
  extractPropertySchemas, filterFeatures 
} from './utils/geoJsonParser';
import { PanelRightClose, PanelRight, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

const DEFAULT_LAYER_COLORS = [
  { fill: '#38bdf8', stroke: '#0284c7' },
  { fill: '#10b981', stroke: '#059669' },
  { fill: '#f59e0b', stroke: '#d97706' },
  { fill: '#ec4899', stroke: '#db2777' },
  { fill: '#8b5cf6', stroke: '#7c3aed' },
  { fill: '#06b6d4', stroke: '#0891b2' },
];

export default function App() {
  const [layers, setLayers] = useState<GisLayer[]>([]);
  const [publishedLayers, setPublishedLayers] = useState<GisLayer[]>([]);
  const [lastPublishedAt, setLastPublishedAt] = useState<number | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState<boolean>(false);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapOption>(BASEMAPS[0]); // Carto Dark
  const [selectedFeature, setSelectedFeature] = useState<GeoJSON.Feature | null>(null);

  // Authentication & Environment Modes (Gestor vs Consumidor)
  const [appMode, setAppMode] = useState<AppMode>('consumidor');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [masterPassword, setMasterPassword] = useState('graprohab2025');
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);

  // Modals & Panels
  const [isBasemapModalOpen, setIsBasemapModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAttributeTableOpen, setIsAttributeTableOpen] = useState(false);
  const [isFieldManagerOpen, setIsFieldManagerOpen] = useState(false);
  const [fieldManagerLayerId, setFieldManagerLayerId] = useState<string | null>(null);
  const fieldManagerLayer = layers.find(l => l.id === fieldManagerLayerId) || null;
  const [isFeatureInspectorOpen, setIsFeatureInspectorOpen] = useState(false);
  const [inspectorFeature, setInspectorFeature] = useState<GeoJSON.Feature | null>(null);
  const [inspectorLayerId, setInspectorLayerId] = useState<string | null>(null);
  const inspectorLayer = layers.find(l => l.id === inspectorLayerId) || null;
  const [inspectorFeatureIndex, setInspectorFeatureIndex] = useState<number>(0);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  const [detailFeature, setDetailFeature] = useState<GeoJSON.Feature | null>(null);
  const [editingLayer, setEditingLayer] = useState<GisLayer | null>(null);

  // Consumer Portal Search & Filter State
  const [consumerMunicipio, setConsumerMunicipio] = useState('');
  const [consumerEmpreendedor, setConsumerEmpreendedor] = useState('');
  const [consumerProtocolo, setConsumerProtocolo] = useState('');
  const [consumerDispensa, setConsumerDispensa] = useState('');
  const [consumerAnoRange, setConsumerAnoRange] = useState<[number, number] | null>(null);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  // UI layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Check saved session & published data on mount
  useEffect(() => {
    const localSession = localStorage.getItem('graprohab_auth_session');
    const sessionAuth = sessionStorage.getItem('graprohab_auth_session');
    if (localSession === 'authenticated' || sessionAuth === 'authenticated') {
      setAppMode('gestor');
    }

    const savedPass = localStorage.getItem('graprohab_custom_pass');
    if (savedPass) {
      setMasterPassword(savedPass);
    }
  }, []);

  // Helper to create a new GisLayer object from GeoJSON
  const createLayerFromGeoJson = useCallback((
    name: string,
    geojson: GeoJSON.FeatureCollection,
    options?: { isRealtime?: boolean; realtimeUrl?: string }
  ): GisLayer => {
    const features = geojson.features || [];
    const geomType = detectGeometryType(features);
    const bbox = calculateBoundingBox(features);
    const schema = extractPropertySchemas(features);
    const colorPreset = DEFAULT_LAYER_COLORS[layers.length % DEFAULT_LAYER_COLORS.length];

    const defaultStyle: LayerStyle = {
      fillColor: colorPreset.fill,
      strokeColor: colorPreset.stroke,
      strokeWidth: geomType === 'LineString' ? 3 : 2,
      fillOpacity: geomType === 'Point' ? 0.85 : 0.45,
      strokeOpacity: 0.9,
      pointRadius: 7,
      pointShape: 'circle',
      smoothFactor: 1.0
    };

    return {
      id: 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name,
      geometryType: geomType,
      data: geojson,
      visible: true,
      opacity: 1,
      style: defaultStyle,
      filters: [],
      featureCount: features.length,
      filteredCount: features.length,
      propertiesSchema: schema,
      bbox,
      createdAt: Date.now(),
      isRealtime: options?.isRealtime,
      realtimeUrl: options?.realtimeUrl
    };
  }, [layers.length]);

  // Load published layers from local storage or initialize with GRAPROHAB SP default
  useEffect(() => {
    const loadFromLocal = async () => {
      try {
        const storedLayers = await localforage.getItem<GisLayer[]>('graprohab_layers');
        const storedTime = await localforage.getItem<number>('graprohab_published_at');
        
        if (storedLayers && Array.isArray(storedLayers) && storedLayers.length > 0) {
          setLayers(storedLayers);
          setPublishedLayers(storedLayers);
          setActiveLayerId(storedLayers[0].id);
          if (storedTime) {
            setLastPublishedAt(storedTime);
          }
          return;
        }
      } catch (err) {
        console.warn('Erro ao carregar dados salvos localmente:', err);
      }
      
      // Default Fallback
      const defaultSample = SAMPLE_DATASETS[0]; // Empreendimentos Habitacionais GRAPROHAB - SP
      const initialLayer = createLayerFromGeoJson(defaultSample.title, defaultSample.data);
      setLayers([initialLayer]);
      setPublishedLayers([initialLayer]);
      setActiveLayerId(initialLayer.id);
    };
    
    loadFromLocal();
  }, []);

  // Publish changes from Gestor (draft) to Consumidor (citizen)
  const handlePublishToPublic = async () => {
    const publishedCopy = JSON.parse(JSON.stringify(layers));
    setPublishedLayers(publishedCopy);
    setHasUnpublishedChanges(false);
    const now = Date.now();
    setLastPublishedAt(now);
    
    showToast('Salvando alterações...');
    try {
      await localforage.setItem('graprohab_layers', publishedCopy);
      await localforage.setItem('graprohab_published_at', now);
      showToast('Camadas e dados publicados com sucesso!', 'success');
    } catch (e) {
      console.error('Falha ao salvar no localforage:', e);
      showToast('Erro ao publicar. Verifique o console.', 'error');
    }
  };

  // Discard draft changes and rollback to last published version
  const handleDiscardDraftChanges = () => {
    if (publishedLayers.length > 0) {
      setLayers(JSON.parse(JSON.stringify(publishedLayers)));
      setHasUnpublishedChanges(false);
      showToast('Alterações descartadas. Restaurado para a última versão publicada.');
    }
  };

  // The layers active for current mode
  const currentModeLayers = appMode === 'gestor' ? layers : (publishedLayers.length > 0 ? publishedLayers : layers);

  // Protected Action Checker (Prompts Password if in Consumidor mode)
  const requireAuth = (action: () => void) => {
    if (appMode === 'gestor') {
      action();
    } else {
      setPendingAuthAction(() => action);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setAppMode('gestor');
    showToast('Acesso de Gestor autenticado com sucesso!');
    if (pendingAuthAction) {
      pendingAuthAction();
      setPendingAuthAction(null);
    }
  };

  const handleLogoutGestor = () => {
    localStorage.removeItem('graprohab_auth_session');
    sessionStorage.removeItem('graprohab_auth_session');
    setAppMode('consumidor');
    showToast('Retornado ao Modo de Consulta Pública.');
  };

  // Handle file drop / upload
  const handleLoadGeoJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      let geojson: GeoJSON.FeatureCollection;

      if (file.name.endsWith('.csv')) {
        const Papa = (await import('papaparse')).default;
        const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
        const rows = parsed.data as Record<string, any>[];

        const features: GeoJSON.Feature[] = [];
        rows.forEach((row) => {
          const lat = row.latitude ?? row.lat ?? row.Latitude ?? row.LAT;
          const lng = row.longitude ?? row.lng ?? row.lon ?? row.Longitude ?? row.LON;
          if (typeof lat === 'number' && typeof lng === 'number') {
            features.push({
              type: 'Feature',
              properties: row,
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              }
            });
          }
        });

        if (features.length === 0) {
          throw new Error('Nenhuma coordenada de latitude e longitude válida encontrada no arquivo CSV.');
        }

        geojson = { type: 'FeatureCollection', features };
      } else {
        geojson = parseGeoJson(text);
      }

      const layerName = file.name.replace(/\.[^/.]+$/, '');
      const newLayer = createLayerFromGeoJson(layerName, geojson);
      
      // Inherit global search filters if active
      const dynamicFilters: AttributeFilter[] = [];
      if (consumerMunicipio.trim()) {
        dynamicFilters.push({ id: 'search_mun', property: '*', type: 'string', operator: 'match_municipio', value: consumerMunicipio.trim(), active: true });
      }
      if (consumerEmpreendedor.trim()) {
        dynamicFilters.push({ id: 'search_emp', property: '*', type: 'string', operator: 'match_empreendedor', value: consumerEmpreendedor.trim(), active: true });
      }
      if (consumerProtocolo.trim()) {
        dynamicFilters.push({ id: 'search_prot', property: '*', type: 'string', operator: 'match_protocolo', value: consumerProtocolo.trim(), active: true });
      }
      if (consumerDispensa.trim()) {
        dynamicFilters.push({ id: 'search_disp', property: '*', type: 'string', operator: 'match_dispensa', value: consumerDispensa.trim(), active: true });
      }

      if (dynamicFilters.length > 0) {
        newLayer.filters = dynamicFilters;
        newLayer.filteredCount = filterFeatures(newLayer.data.features, newLayer.filters).length;
      }

      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
      showToast(`Camada "${layerName}" carregada com sucesso (${newLayer.featureCount} polígonos/feições)!`);
    } catch (err: any) {
      console.error('Erro ao ler arquivo:', err);
      showToast(err.message || 'Falha ao processar arquivo GeoJSON.', 'error');
    }
  };

  // Load pre-built SP dataset
  const handleLoadSampleDataset = (datasetId: string) => {
    const sample = SAMPLE_DATASETS.find(d => d.id === datasetId);
    if (!sample) return;

    const newLayer = createLayerFromGeoJson(sample.title, sample.data);
    
    const dynamicFilters: AttributeFilter[] = [];
    if (consumerMunicipio.trim()) {
      dynamicFilters.push({ id: 'search_mun', property: '*', type: 'string', operator: 'match_municipio', value: consumerMunicipio.trim(), active: true });
    }
    if (consumerEmpreendedor.trim()) {
      dynamicFilters.push({ id: 'search_emp', property: '*', type: 'string', operator: 'match_empreendedor', value: consumerEmpreendedor.trim(), active: true });
    }
    if (consumerProtocolo.trim()) {
      dynamicFilters.push({ id: 'search_prot', property: '*', type: 'string', operator: 'match_protocolo', value: consumerProtocolo.trim(), active: true });
    }
    if (consumerDispensa.trim()) {
      dynamicFilters.push({ id: 'search_disp', property: '*', type: 'string', operator: 'match_dispensa', value: consumerDispensa.trim(), active: true });
    }

    if (dynamicFilters.length > 0) {
      newLayer.filters = dynamicFilters;
      newLayer.filteredCount = filterFeatures(newLayer.data.features, newLayer.filters).length;
    }

    setLayers(prev => [newLayer, ...prev]);
    setActiveLayerId(newLayer.id);
    showToast(`Camada "${sample.title}" adicionada.`);
  };

  // Handle Layer actions
  const handleToggleVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };

  const handleChangeSmoothFactor = (id: string, smoothFactor: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, style: { ...l.style, smoothFactor } } : l));
  };

  const handleRenameLayer = (id: string, newName: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const handleReorderLayers = (activeId: string, overId: string) => {
    setLayers(prev => {
      const oldIndex = prev.findIndex(l => l.id === activeId);
      const newIndex = prev.findIndex(l => l.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newLayers = [...prev];
      const [removed] = newLayers.splice(oldIndex, 1);
      newLayers.splice(newIndex, 0, removed);
      return newLayers;
    });
  };

  const handleUpdateDescription = (id: string, newDescription: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, description: newDescription } : l));
  };

  const handleDuplicateLayer = (id: string) => {
    const orig = layers.find(l => l.id === id);
    if (!orig) return;
    const duplicated: GisLayer = {
      ...orig,
      id: 'layer_' + Date.now(),
      name: `${orig.name} (Cópia)`,
      createdAt: Date.now()
    };
    setLayers(prev => [duplicated, ...prev]);
    setActiveLayerId(duplicated.id);
    showToast(`Camada duplicada: ${duplicated.name}`);
  };

  const handleDeleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(layers.filter(l => l.id !== id)[0]?.id || null);
    }
    showToast('Camada removida.');
  };

  const handleUpdateFilters = (layerId: string, filters: AttributeFilter[], spatialFilter?: SpatialFilter) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        const filtered = filterFeatures(l.data.features, filters, spatialFilter);
        return {
          ...l,
          filters,
          spatialFilter,
          filteredCount: filtered.length
        };
      }
      return l;
    }));
  };

  const handleSaveStyle = (
    layerId: string,
    style: LayerStyle,
    thematic?: ThematicConfig,
    isHeatmap?: boolean
  ) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        return { ...l, style, thematic, isHeatmap };
      }
      return l;
    }));
    showToast('Estilo e legenda atualizados!');
  };

  // Synchronize cumulative multi-filters with active layers
  const handleMultiFilterChange = (municipio: string, empreendedor: string, protocolo: string, dispensa: string, anoRange: [number, number] | null) => {
    setConsumerMunicipio(municipio);
    setConsumerEmpreendedor(empreendedor);
    setConsumerProtocolo(protocolo);
    setConsumerDispensa(dispensa);
    setConsumerAnoRange(anoRange);
    
    let hasProtocoloFilter = !!protocolo.trim();
    let hasDispensaFilter = !!dispensa.trim();
    let hasMatch = false;

    setLayers(prev => {
      const newLayers = prev.map(l => {
        // 1. Keep any existing manual filters that are NOT from the quick search bar
        const existingFilters = l.filters?.filter(f => !['search_mun', 'search_emp', 'search_prot', 'search_disp', 'search_ano'].includes(f.id)) || [];

        const dynamicFilters: AttributeFilter[] = [...existingFilters];

        // 2. Add active quick search filters
        if (municipio.trim()) {
          dynamicFilters.push({
            id: 'search_mun', property: '*', type: 'string',
            operator: 'match_municipio', value: municipio.trim(), active: true
          });
        }
        if (empreendedor.trim()) {
          dynamicFilters.push({
            id: 'search_emp', property: '*', type: 'string',
            operator: 'match_empreendedor', value: empreendedor.trim(), active: true
          });
        }
        if (protocolo.trim()) {
          dynamicFilters.push({
            id: 'search_prot', property: '*', type: 'string',
            operator: 'match_protocolo', value: protocolo.trim(), active: true
          });
        }
        if (dispensa.trim()) {
          dynamicFilters.push({
            id: 'search_disp', property: '*', type: 'string',
            operator: 'match_dispensa', value: dispensa.trim(), active: true
          });
        }
        if (anoRange) {
          dynamicFilters.push({
            id: 'search_ano', property: '*', type: 'number',
            operator: 'match_ano_entrada', value: anoRange, active: true
          });
        }

        // 3. Apply the combined filters to the layer's features
        const filtered = filterFeatures(l.data.features, dynamicFilters, l.spatialFilter);
        
        if ((hasProtocoloFilter || hasDispensaFilter) && filtered.length > 0) {
          hasMatch = true;
        }

        return {
          ...l,
          filters: dynamicFilters,
          filteredCount: filtered.length
        };
      });

      if ((hasProtocoloFilter || hasDispensaFilter) && hasMatch) {
        setTimeout(() => setFitBoundsTrigger(prevVal => prevVal + 1), 50); // slight delay to ensure layers update
      }

      return newLayers;
    });
  };

  const handleOpenProjectDetail = (feature: GeoJSON.Feature) => {
    setSelectedFeature(feature);
    setDetailFeature(feature);
    setIsProjectDetailOpen(true);
  };

  const handleDrawingCreated = (drawnFeature: GeoJSON.Feature) => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (activeLayer) {
      const updatedFeatures = [...activeLayer.data.features, drawnFeature];
      const updatedCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: updatedFeatures
      };
      const schema = extractPropertySchemas(updatedFeatures);
      const bbox = calculateBoundingBox(updatedFeatures);

      setLayers(prev => prev.map(l => l.id === activeLayer.id ? {
        ...l,
        data: updatedCollection,
        featureCount: updatedFeatures.length,
        filteredCount: updatedFeatures.length,
        propertiesSchema: schema,
        bbox
      } : l));
      showToast('Novo polígono habitacional desenhado e adicionado!');
    } else {
      const newLayer = createLayerFromGeoJson('Novos Polígonos Desenhados', {
        type: 'FeatureCollection',
        features: [drawnFeature]
      });
      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
      showToast('Camada de desenhos criada!');
    }
  };

  // Field Manipulation & Geometry Editing Handlers
  const handleRenameField = (layerId: string, oldKey: string, newKey: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;

      const updatedFeatures = l.data.features.map(f => {
        const newProps = { ...(f.properties || {}) };
        if (oldKey in newProps) {
          newProps[newKey] = newProps[oldKey];
          delete newProps[oldKey];
        }
        return { ...f, properties: newProps };
      });

      const updatedCollection: GeoJSON.FeatureCollection = {
        ...l.data,
        features: updatedFeatures
      };

      const newSchema = extractPropertySchemas(updatedFeatures);

      let newThematic = l.thematic;
      if (newThematic && newThematic.property === oldKey) {
        newThematic = { ...newThematic, property: newKey };
      }

      const updatedFilters = l.filters.map(f => f.property === oldKey ? { ...f, property: newKey } : f);

      return {
        ...l,
        data: updatedCollection,
        propertiesSchema: newSchema,
        thematic: newThematic,
        filters: updatedFilters
      };
    }));

    showToast(`Campo "${oldKey}" renomeado para "${newKey}"!`);
  };

  const handleDeleteField = (layerId: string, fieldKey: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;

      const updatedFeatures = l.data.features.map(f => {
        const newProps = { ...(f.properties || {}) };
        delete newProps[fieldKey];
        return { ...f, properties: newProps };
      });

      const updatedCollection: GeoJSON.FeatureCollection = {
        ...l.data,
        features: updatedFeatures
      };

      const newSchema = extractPropertySchemas(updatedFeatures);

      let newThematic = l.thematic;
      if (newThematic && newThematic.property === fieldKey) {
        newThematic = { ...newThematic, enabled: false };
      }

      const updatedFilters = l.filters.filter(f => f.property !== fieldKey);

      return {
        ...l,
        data: updatedCollection,
        propertiesSchema: newSchema,
        thematic: newThematic,
        filters: updatedFilters
      };
    }));

    showToast(`Campo "${fieldKey}" excluído com sucesso!`);
  };

  const handleAddField = (layerId: string, fieldName: string, defaultValue: any, fieldType: 'string' | 'number') => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;

      const updatedFeatures = l.data.features.map(f => {
        const newProps = { ...(f.properties || {}) };
        newProps[fieldName] = defaultValue !== undefined && defaultValue !== '' 
          ? (fieldType === 'number' ? Number(defaultValue) : String(defaultValue))
          : null;
        return { ...f, properties: newProps };
      });

      const updatedCollection: GeoJSON.FeatureCollection = {
        ...l.data,
        features: updatedFeatures
      };

      const newSchema = extractPropertySchemas(updatedFeatures);

      return {
        ...l,
        data: updatedCollection,
        propertiesSchema: newSchema
      };
    }));

    showToast(`Novo campo "${fieldName}" adicionado à camada!`);
  };

  const handleUpdateCellValue = (layerId: string, featureIndex: number, fieldKey: string, value: any) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;

      const updatedFeatures = [...l.data.features];
      if (updatedFeatures[featureIndex]) {
        const feat = updatedFeatures[featureIndex];
        const newProps = { ...(feat.properties || {}) };
        newProps[fieldKey] = value;
        updatedFeatures[featureIndex] = { ...feat, properties: newProps };
      }

      const updatedCollection: GeoJSON.FeatureCollection = {
        ...l.data,
        features: updatedFeatures
      };

      const newSchema = extractPropertySchemas(updatedFeatures);

      return {
        ...l,
        data: updatedCollection,
        propertiesSchema: newSchema
      };
    }));

    showToast('Valor atualizado com sucesso!');
  };

  const handleDeleteFeature = (layerId: string, featureIndex: number) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;

      const updatedFeatures = l.data.features.filter((_, idx) => idx !== featureIndex);
      const updatedCollection: GeoJSON.FeatureCollection = {
        ...l.data,
        features: updatedFeatures
      };

      const newSchema = extractPropertySchemas(updatedFeatures);
      const bbox = calculateBoundingBox(updatedFeatures);

      return {
        ...l,
        data: updatedCollection,
        featureCount: updatedFeatures.length,
        filteredCount: updatedFeatures.length,
        propertiesSchema: newSchema,
        bbox
      };
    }));

    showToast('Feição excluída com sucesso!');
  };

  const handleOpenFeatureInspector = (feature: GeoJSON.Feature, layerId: string, featureIndex?: number) => {
    const targetLayer = layers.find(l => l.id === layerId) || activeLayer;
    const resolvedIndex = featureIndex !== undefined 
      ? featureIndex 
      : (targetLayer ? targetLayer.data.features.indexOf(feature) : 0);
    
    setInspectorFeature(feature);
    setInspectorLayerId(targetLayer ? targetLayer.id : null);
    setInspectorFeatureIndex(resolvedIndex >= 0 ? resolvedIndex : 0);
    setSelectedFeature(feature);
    setActiveLayerId(layerId);
    setIsFeatureInspectorOpen(true);
  };

  const handleUpdateFeatureProperties = (layerId: string, featureIndex: number, updatedProperties: Record<string, any>) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;

      const updatedFeatures = [...l.data.features];
      if (updatedFeatures[featureIndex]) {
        const feat = updatedFeatures[featureIndex];
        updatedFeatures[featureIndex] = {
          ...feat,
          properties: { ...updatedProperties }
        };
      }

      const updatedCollection: GeoJSON.FeatureCollection = {
        ...l.data,
        features: updatedFeatures
      };

      const newSchema = extractPropertySchemas(updatedFeatures);

      return {
        ...l,
        data: updatedCollection,
        propertiesSchema: newSchema
      };
    }));

    setInspectorFeature(prev => prev ? { ...prev, properties: { ...updatedProperties } } : null);
    showToast('Atributos da feição atualizados com sucesso!');
  };

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0] || null;

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden"
    >
      {/* Top Navbar with GRAPROHAB Branding & Mode Controls */}
      <Navbar
        layers={currentModeLayers}
        activeBasemap={activeBasemap}
        appMode={appMode}
        onToggleAuthModal={() => setIsAuthModalOpen(true)}
        onLogoutGestor={handleLogoutGestor}
        onOpenBasemapModal={() => setIsBasemapModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onLoadGeoJsonFile={(file) => requireAuth(() => handleLoadGeoJsonFile(file))}

        onRequireAuth={requireAuth}
        onPublishToPublic={handlePublishToPublic}
        lastPublishedAt={lastPublishedAt}
        hasUnpublishedChanges={hasUnpublishedChanges}
      />

      {/* Consumer Consultation Portal Bar */}
      <ConsumerPortal
        layers={currentModeLayers}
        onSelectFeature={handleOpenProjectDetail}
        onFilterChange={handleMultiFilterChange}
        municipioFilter={consumerMunicipio}
        empreendedorFilter={consumerEmpreendedor}
        protocoloFilter={consumerProtocolo}
        dispensaFilter={consumerDispensa}
        anoFilter={consumerAnoRange}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Center Interactive Map */}
        <main className="flex-1 relative h-full w-full">
          {/* Toggle Sidebar Button */}
          <button
            id="btn-toggle-sidebar"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-3 right-16 z-[1000] p-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white shadow-xl backdrop-blur-xs transition-colors"
            title={isSidebarOpen ? 'Recolher Painel' : 'Expandir Painel'}
          >
            {isSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
          </button>
          
          <MapComponent
            layers={currentModeLayers}
            activeBasemap={activeBasemap}
            selectedFeature={selectedFeature}
            fitBoundsTrigger={fitBoundsTrigger}
            onFeatureClick={(feature, layerId, featureIndex) => {
              handleOpenFeatureInspector(feature, layerId, featureIndex);
            }}
            onOpenFeatureInspector={(feature, layerId, featureIndex) => {
              handleOpenFeatureInspector(feature, layerId, featureIndex);
            }}
            onDrawingCreated={(drawn) => requireAuth(() => handleDrawingCreated(drawn))}
            onOpenDetailModal={handleOpenProjectDetail}
            onOpenFieldManager={(layerId) => {
              const target = currentModeLayers.find(l => l.id === layerId);
              if (target) {
                setFieldManagerLayerId(target.id);
                setIsFieldManagerOpen(true);
              }
            }}
            onOpenAttributeTable={(layerId) => {
              setActiveLayerId(layerId);
              setIsAttributeTableOpen(true);
            }}
          />
        </main>

        {/* Right Layer Manager Sidebar */}
        <div 
          className={`transition-all duration-300 ease-in-out shrink-0 z-20 flex flex-col border-l border-slate-800 ${
            isSidebarOpen ? 'w-80 sm:w-88' : 'w-0'
          }`}
        >
          {isSidebarOpen && (
            <LayerManager
              layers={currentModeLayers}
              activeLayerId={activeLayerId}
              appMode={appMode}
              onSelectActiveLayer={(id) => setActiveLayerId(id)}
              onToggleVisibility={handleToggleVisibility}
              onChangeOpacity={handleChangeOpacity}
              onChangeSmoothFactor={handleChangeSmoothFactor}
              onRenameLayer={handleRenameLayer}
              onUpdateDescription={handleUpdateDescription}
              onZoomToLayer={(id) => {
                const target = currentModeLayers.find(l => l.id === id);
                if (target) {
                  setSelectedFeature({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'Polygon',
                      coordinates: [[
                        [target.bbox[0], target.bbox[1]],
                        [target.bbox[2], target.bbox[1]],
                        [target.bbox[2], target.bbox[3]],
                        [target.bbox[0], target.bbox[3]],
                        [target.bbox[0], target.bbox[1]]
                      ]]
                    }
                  });
                }
              }}
              onOpenStyleModal={(layer) => {
                setEditingLayer(layer);
                setIsStyleModalOpen(true);
              }}
              onOpenFilterPanel={(layer) => {
                setEditingLayer(layer);
                setIsFilterPanelOpen(true);
              }}
              onOpenAttributeTable={(layer) => {
                setActiveLayerId(layer.id);
                setIsAttributeTableOpen(true);
              }}
              onOpenFieldManager={(layer) => {
                setFieldManagerLayerId(layer.id);
                setIsFieldManagerOpen(true);
              }}
              onDuplicateLayer={handleDuplicateLayer}
              onDeleteLayer={handleDeleteLayer}
              onRequireAuth={requireAuth}
              onReorderLayers={handleReorderLayers}
            />
          )}
        </div>
      </div>

      {/* Attribute Table Drawer */}
      {isAttributeTableOpen && (
        <AttributeTable
          layer={activeLayer}
          isOpen={isAttributeTableOpen}
          appMode={appMode}
          onRequireAuth={requireAuth}
          onClose={() => setIsAttributeTableOpen(false)}
          onSelectFeature={(feature, zoomTo) => {
            if (zoomTo) {
              setSelectedFeature(feature);
            }
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onRenameField={handleRenameField}
          onDeleteField={handleDeleteField}
          onAddField={handleAddField}
          onUpdateCellValue={handleUpdateCellValue}
          onDeleteFeature={handleDeleteFeature}
          onOpenFeatureInspector={(feature, layerId, featureIndex) => {
            handleOpenFeatureInspector(feature, layerId, featureIndex);
          }}
          onOpenFieldManager={() => {
            if (activeLayer) {
              setFieldManagerLayerId(activeLayer.id);
              setIsFieldManagerOpen(true);
            }
          }}
        />
      )}

      {/* Feature Inspector & Attribute/Field Editor Modal */}
      {isFeatureInspectorOpen && inspectorFeature && (
        <FeatureInspectorModal
          isOpen={isFeatureInspectorOpen}
          onClose={() => {
            setIsFeatureInspectorOpen(false);
            setInspectorFeature(null);
          }}
          feature={inspectorFeature}
          layer={inspectorLayer || activeLayer}
          featureIndex={inspectorFeatureIndex}
          appMode={appMode}
          onRequireAuth={requireAuth}
          onUpdateFeatureProperties={handleUpdateFeatureProperties}
          onRenameField={handleRenameField}
          onDeleteField={handleDeleteField}
          onAddField={handleAddField}
          onDeleteFeature={handleDeleteFeature}
          onSelectFeatureIndex={(newIdx) => {
            const currentL = inspectorLayer || activeLayer;
            if (!currentL) return;
            const nextFeat = currentL.data.features[newIdx];
            if (nextFeat) {
              setInspectorFeature(nextFeat);
              setInspectorFeatureIndex(newIdx);
              setSelectedFeature(nextFeat);
            }
          }}
          onZoomToFeature={(feat) => {
            setSelectedFeature(feat);
          }}
          onOpenGraprohabDetail={(feat) => {
            setDetailFeature(feat);
            setIsProjectDetailOpen(true);
          }}
        />
      )}

      {/* Field Manager Modal (Rename & Delete columns / fields) */}
      {isFieldManagerOpen && (fieldManagerLayer || activeLayer) && (
        <FieldManagerModal
          layer={fieldManagerLayer || activeLayer!}
          isOpen={isFieldManagerOpen}
          onClose={() => {
            setIsFieldManagerOpen(false);
            setFieldManagerLayerId(null);
          }}
          onRenameField={handleRenameField}
          onDeleteField={handleDeleteField}
          onAddField={handleAddField}
        />
      )}

      {/* Official GRAPROHAB Project Detail Modal (Ficha Técnica) */}
      {isProjectDetailOpen && detailFeature && (
        <ProjectDetailModal
          feature={detailFeature}
          isOpen={isProjectDetailOpen}
          onClose={() => setIsProjectDetailOpen(false)}
          onCenterOnMap={(feat) => {
            setSelectedFeature(feat);
          }}
        />
      )}

      {/* Password Authentication Modal for Gestor Mode */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingAuthAction(null);
          }}
          onSuccess={handleAuthSuccess}
          masterPassword={masterPassword}
          onUpdatePassword={(newPass) => {
            setMasterPassword(newPass);
            localStorage.setItem('graprohab_custom_pass', newPass);
            showToast('Senha de gestor atualizada!');
          }}
        />
      )}

      {/* Other Core Modals */}
      {isBasemapModalOpen && (
        <BasemapSelector
          currentBasemap={activeBasemap}
          onSelectBasemap={(b) => setActiveBasemap(b)}
          isOpen={isBasemapModalOpen}
          onClose={() => setIsBasemapModalOpen(false)}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          layers={layers}
          activeLayerId={activeLayerId}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {isStyleModalOpen && (editingLayer || activeLayer) && (
        <StyleModal
          layer={editingLayer || activeLayer}
          isOpen={isStyleModalOpen}
          onClose={() => {
            setIsStyleModalOpen(false);
            setEditingLayer(null);
          }}
          onSaveStyle={handleSaveStyle}
        />
      )}

      {isFilterPanelOpen && (editingLayer || activeLayer) && (
        <FilterPanel
          layer={editingLayer || activeLayer}
          isOpen={isFilterPanelOpen}
          onClose={() => {
            setIsFilterPanelOpen(false);
            setEditingLayer(null);
          }}
          onUpdateFilters={handleUpdateFilters}
          onOpenAiAssistant={() => setIsAiModalOpen(true)}
        />
      )}

      {isAiModalOpen && activeLayer && (
        <AiGisModal
          layer={activeLayer}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApplySuggestedFilter={(layerId, filter) => {
            const l = layers.find(item => item.id === layerId);
            if (l) {
              const updatedFilters = [...l.filters, filter];
              handleUpdateFilters(layerId, updatedFilters, l.spatialFilter);
              showToast(`Filtro "${filter.property} ${filter.operator} ${filter.value}" aplicado pela IA!`);
            }
          }}
        />
      )}


      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-medium backdrop-blur-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200 shadow-emerald-950/50'
              : 'bg-rose-950/90 border-rose-500/60 text-rose-200 shadow-rose-950/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
