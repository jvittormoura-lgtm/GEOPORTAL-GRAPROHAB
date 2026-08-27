import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { BasemapOption, GisLayer } from '../types/gis';
import { 
  filterFeatures, 
  haversineDistance, 
  calculateFeatureArea,
  extractUhFromProperties,
  extractAreaM2FromProperties,
  extractFeaturesMetrics,
  calculateBoundingBox
} from '../utils/geoJsonParser';
import { 
  Compass, MapPin, Layers
} from 'lucide-react';

interface MapComponentProps {
  layers: GisLayer[];
  activeBasemap: BasemapOption;
  selectedFeature: GeoJSON.Feature | null;
  fitBoundsTrigger?: number;
  onFeatureClick?: (feature: GeoJSON.Feature, layerId: string, featureIndex?: number) => void;
  onOpenFeatureInspector?: (feature: GeoJSON.Feature, layerId: string, featureIndex: number) => void;
  onDrawingCreated?: (geojson: GeoJSON.Feature) => void;
  onOpenDetailModal?: (feature: GeoJSON.Feature) => void;
  onOpenFieldManager?: (layerId: string) => void;
  onOpenAttributeTable?: (layerId: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  layers,
  activeBasemap,
  selectedFeature,
  fitBoundsTrigger,
  onFeatureClick,
  onOpenFeatureInspector,
  onDrawingCreated,
  onOpenDetailModal,
  onOpenFieldManager,
  onOpenAttributeTable
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vectorLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());
  const highlightLayerRef = useRef<L.GeoJSON | null>(null);

  // Mouse HUD
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(3);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-22.3, -49.0], // Estado de São Paulo center
      zoom: 7,
      zoomControl: false,
      attributionControl: true
    });

    // Custom zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    // Initial tile layer
    const tileLayer = L.tileLayer(activeBasemap.url, {
      attribution: activeBasemap.attribution,
      maxZoom: activeBasemap.maxZoom,
      subdomains: activeBasemap.subdomains || ['a', 'b', 'c']
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({
        lat: parseFloat(e.latlng.lat.toFixed(5)),
        lng: parseFloat(e.latlng.lng.toFixed(5))
      });
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(activeBasemap.url, {
      attribution: activeBasemap.attribution,
      maxZoom: activeBasemap.maxZoom,
      subdomains: activeBasemap.subdomains || ['a', 'b', 'c']
    }).addTo(map);

    // Send tile layer to back so vector layers stay on top
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeBasemap]);

  // Style calculator for features
  const getFeatureStyle = useCallback((feature: GeoJSON.Feature, layer: GisLayer): L.PathOptions => {
    const defaultFill = layer.style.fillColor;
    const defaultStroke = layer.style.strokeColor;
    let fill = defaultFill;
    let stroke = defaultStroke;

    // Check thematic classification
    if (layer.thematic && layer.thematic.enabled && layer.thematic.classes.length > 0) {
      const propKey = layer.thematic.property;
      const rawVal = feature.properties ? feature.properties[propKey] : null;

      if (rawVal !== null && rawVal !== undefined) {
        if (layer.thematic.mode === 'graduated' && typeof rawVal === 'number') {
          for (const cls of layer.thematic.classes) {
            if (cls.min !== undefined && cls.max !== undefined) {
              if (rawVal >= cls.min && rawVal <= cls.max) {
                fill = cls.color;
                break;
              }
            }
          }
        } else {
          // Categorical
          const strVal = String(rawVal);
          const found = layer.thematic.classes.find(c => c.value === strVal);
          if (found) fill = found.color;
        }
      }
    }

    return {
      fillColor: fill,
      color: stroke,
      weight: layer.style.strokeWidth,
      opacity: layer.style.strokeOpacity * layer.opacity,
      fillOpacity: layer.style.fillOpacity * layer.opacity
    };
  }, []);

  // Register global window helper functions for interactive popup buttons
  useEffect(() => {
    (window as any).__gis_open_detail = (featureEncoded: string) => {
      try {
        const feat = JSON.parse(decodeURIComponent(featureEncoded));
        if (onOpenDetailModal) {
          onOpenDetailModal(feat);
        }
      } catch (e) {
        console.error('Error opening detail modal from popup:', e);
      }
    };

    (window as any).__gis_open_feature_inspector = (layerId: string, featureIndex: number) => {
      const targetLayer = layers.find(l => l.id === layerId);
      if (targetLayer && onOpenFeatureInspector) {
        const feat = targetLayer.data.features[featureIndex] || targetLayer.data.features[0];
        if (feat) {
          onOpenFeatureInspector(feat, layerId, featureIndex);
        }
      }
    };

    (window as any).__gis_open_field_manager = (layerId: string) => {
      if (onOpenFieldManager) {
        onOpenFieldManager(layerId);
      }
    };

    (window as any).__gis_open_attr_table = (layerId: string) => {
      if (onOpenAttributeTable) {
        onOpenAttributeTable(layerId);
      }
    };

    (window as any).__gis_copy_props = (propsEncoded: string) => {
      try {
        const jsonText = decodeURIComponent(propsEncoded);
        navigator.clipboard.writeText(jsonText);
        // Show brief visual notice
        const notice = document.createElement('div');
        notice.innerText = '✓ Atributos copiados!';
        notice.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0284c7;color:#fff;padding:8px 16px;border-radius:9999px;font-size:12px;font-weight:600;z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 2000);
      } catch (e) {
        console.error('Error copying props:', e);
      }
    };

    return () => {
      delete (window as any).__gis_open_detail;
      delete (window as any).__gis_open_feature_inspector;
      delete (window as any).__gis_open_field_manager;
      delete (window as any).__gis_open_attr_table;
      delete (window as any).__gis_copy_props;
    };
  }, [layers, onOpenDetailModal, onOpenFeatureInspector, onOpenFieldManager, onOpenAttributeTable]);

  // Format popup table HTML
  const createPopupContent = useCallback((feature: GeoJSON.Feature, layer: GisLayer, featureIndex: number): string => {
    const props = feature.properties || {};
    const geomType = feature.geometry?.type || 'Geometria';
    
    // Calculate geometric metrics
    let geomMetric = '';
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      const areaM2 = calculateFeatureArea(feature);
      if (areaM2 > 0) {
        const ha = (areaM2 / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        const m2Formatted = areaM2.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
        geomMetric = `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(51, 65, 85, 0.5);">
            <span style="color: #94a3b8; font-size: 11px;">Área Calculada:</span>
            <span style="color: #38bdf8; font-weight: 700; font-size: 11px;">
              ${ha} ha <span style="color: #64748b; font-weight: 400; font-size: 10px;">(${m2Formatted} m²)</span>
            </span>
          </div>
        `;
      }
    }

    // Extract key metrics: UH and Gleba Area
    const uhCount = extractUhFromProperties(props);
    const glebaAreaM2 = extractAreaM2FromProperties(props, feature);
    let keyMetricsHtml = '';

    if (uhCount > 0 || glebaAreaM2 > 0) {
      keyMetricsHtml = `
        <div style="display: flex; gap: 6px; padding: 6px 12px; background: #070d1d; border-bottom: 1px solid #1e293b;">
          ${uhCount > 0 ? `
            <div style="flex: 1; padding: 4px 6px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px;">
              <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Lotes / UH</div>
              <div style="font-size: 11px; font-weight: 800; color: #38bdf8; font-family: monospace;">${uhCount.toLocaleString('pt-BR')} UH</div>
            </div>
          ` : ''}
          ${glebaAreaM2 > 0 ? `
            <div style="flex: 1; padding: 4px 6px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 6px;">
              <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Área da Gleba</div>
              <div style="font-size: 11px; font-weight: 800; color: #34d399; font-family: monospace;">${(glebaAreaM2 / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha <span style="font-size: 9px; font-weight: 400; color: #64748b;">(${glebaAreaM2.toLocaleString('pt-BR')} m²)</span></div>
            </div>
          ` : ''}
        </div>
      `;
    }

    const isGraprohab = !!(props.processo_graprohab || props.nome_empreendimento);
    
    // Determine custom popup title if configured or fallback
    let title = '';
    if (layer.popupTitleField && props[layer.popupTitleField] !== undefined && props[layer.popupTitleField] !== null) {
      title = String(props[layer.popupTitleField]);
    } else {
      const candidates = ['nome_empreendimento', 'nome', 'Nome', 'NOME', 'titulo', 'name', 'processo_graprohab', 'processo'];
      let foundTitle = '';
      for (const c of candidates) {
        if (props[c] !== undefined && props[c] !== null) {
          foundTitle = String(props[c]);
          break;
        }
      }
      if (!foundTitle && layer.propertiesSchema && layer.propertiesSchema.length > 0) {
        const firstKey = layer.propertiesSchema[0].key;
        if (props[firstKey] !== undefined && props[firstKey] !== null) {
          foundTitle = String(props[firstKey]);
        }
      }
      title = foundTitle || `Feição #${featureIndex + 1}`;
    }

    // Determine field display order and visibility
    let orderedKeys: string[] = [];
    if (layer.popupFieldOrder && layer.popupFieldOrder.length > 0) {
      orderedKeys = [...layer.popupFieldOrder];
    } else if (layer.propertiesSchema && layer.propertiesSchema.length > 0) {
      orderedKeys = layer.propertiesSchema.map(p => p.key);
    } else {
      orderedKeys = Object.keys(props);
    }

    // Filter by visibility if defined
    if (layer.popupVisibleFields && layer.popupVisibleFields.length > 0) {
      orderedKeys = orderedKeys.filter(k => layer.popupVisibleFields!.includes(k));
    }
    
    let rowsHtml = '';
    orderedKeys.forEach((key) => {
      if (!(key in props)) return;
      const val = props[key];
      const displayVal = val !== null && val !== undefined ? String(val) : '<span style="color: #64748b; font-style: italic;">null</span>';
      rowsHtml += `
        <tr style="border-bottom: 1px solid rgba(51, 65, 85, 0.35);">
          <td style="padding: 4px 8px; font-weight: 600; color: #94a3b8; font-size: 11px; white-space: nowrap; vertical-align: top; background: rgba(15, 23, 42, 0.4); width: 35%;">${key}</td>
          <td style="padding: 4px 8px; color: #f1f5f9; font-size: 11px; word-break: break-word; font-family: monospace;">${displayVal}</td>
        </tr>
      `;
    });

    const featEncoded = encodeURIComponent(JSON.stringify(feature));
    const propsEncoded = encodeURIComponent(JSON.stringify(props, null, 2));

    // Status badge if available
    let statusBadge = '';
    if (props.status_graprohab) {
      const color = props.status_graprohab === 'Aprovado com Certificado' 
        ? '#10b981' 
        : props.status_graprohab === 'Em Análise Técnica' 
        ? '#f59e0b' 
        : '#38bdf8';
      statusBadge = `
        <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: rgba(56, 189, 248, 0.12); color: ${color}; border: 1px solid ${color}40;">
          ${props.status_graprohab}
        </span>
      `;
    }

    return `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 270px; max-width: 350px; color: #f1f5f9; background: #0b1329; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <!-- Header -->
        <div style="padding: 10px 12px; background: #0f172a; border-bottom: 1px solid #1e293b;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${layer.name}
            </span>
            <div style="display: flex; align-items: center; gap: 4px; shrink-0;">
              ${statusBadge}
              <span style="font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px; background: #1e293b; color: #cbd5e1;">
                ${geomType}
              </span>
            </div>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #ffffff; line-height: 1.3;">
            ${title}
          </div>
          ${props.municipio ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">📍 ${props.municipio}</div>` : ''}
        </div>

        <!-- Metric -->
        ${geomMetric ? `<div style="padding: 4px 12px; background: #070c18; border-bottom: 1px solid #1e293b;">${geomMetric}</div>` : ''}

        <!-- Attributes Table List -->
        <div style="max-height: 180px; overflow-y: auto; padding: 2px 0; background: #090e1d;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${rowsHtml || '<tr><td style="padding: 12px; color: #64748b; font-size: 11px; text-align: center;">Sem atributos nesta feição</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Action Buttons in Popup -->
        <div style="padding: 8px 10px; background: #0a0f1d; border-top: 1px solid #1e293b; display: flex; flex-direction: column; gap: 5px;">
          <button onclick="window.__gis_open_feature_inspector('${layer.id}', ${featureIndex})" style="width: 100%; padding: 7px 10px; background: #0284c7; color: #ffffff; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ✏️ Editar Campos & Valores
          </button>
          ${isGraprohab ? `
            <button onclick="window.__gis_open_detail('${featEncoded}')" style="width: 100%; padding: 5px 10px; background: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              📄 Ficha Técnica Habitacional
            </button>
          ` : ''}
          <div style="display: flex; gap: 5px;">
            <button onclick="window.__gis_open_field_manager('${layer.id}')" style="flex: 1; padding: 5px 6px; background: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; text-align: center;">
              ⚙️ Colunas
            </button>
            <button onclick="window.__gis_open_attr_table('${layer.id}')" style="flex: 1; padding: 5px 6px; background: #1e293b; color: #34d399; border: 1px solid #334155; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; text-align: center;">
              📊 Tabela
            </button>
            <button onclick="window.__gis_copy_props('${propsEncoded}')" style="flex: 1; padding: 5px 6px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; text-align: center;">
              📋 Copiar
            </button>
          </div>
        </div>
      </div>
    `;
  }, []);

  // Update Vector Layers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove layers no longer in props
    const currentLayerIds = new Set(layers.map(l => l.id));
    vectorLayersRef.current.forEach((leafletGeoJson, layerId) => {
      if (!currentLayerIds.has(layerId)) {
        map.removeLayer(leafletGeoJson);
        vectorLayersRef.current.delete(layerId);
      }
    });

    // Add or update layers (reverse to match Photoshop/QGIS top-to-bottom visual order)
    [...layers].reverse().forEach((layer) => {
      const existing = vectorLayersRef.current.get(layer.id);
      if (existing) {
        map.removeLayer(existing);
      }

      if (!layer.visible) return;

      // Filter features
      const filtered = filterFeatures(layer.data.features, layer.filters, layer.spatialFilter);
      if (filtered.length === 0) return;

      const filteredCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: filtered
      };

      const geoJsonOptions: any = {
        smoothFactor: layer.style.smoothFactor !== undefined ? layer.style.smoothFactor : 1.0,
        style: (feature: GeoJSON.Feature) => {
          if (!feature) return {};
          return getFeatureStyle(feature, layer);
        },
        pointToLayer: (feature, latlng) => {
          const style = getFeatureStyle(feature, layer);
          return L.circleMarker(latlng, {
            radius: layer.style.pointRadius,
            fillColor: style.fillColor,
            color: style.color,
            weight: style.weight,
            opacity: style.opacity,
            fillOpacity: style.fillOpacity
          });
        },
        onEachFeature: (feature, leafletLayer) => {
          const featureIndex = layer.data.features.indexOf(feature) >= 0 
            ? layer.data.features.indexOf(feature) 
            : 0;

          // Bind popup
          const popupContent = createPopupContent(feature, layer, featureIndex);
          leafletLayer.bindPopup(popupContent, { 
            maxWidth: 360, 
            className: 'custom-gis-popup',
            autoPan: true,
            autoPanPadding: [40, 40]
          });

          // Hover tooltips for quick preview
          const props = feature.properties || {};
          const tooltipText = props.name || props.nome || props.cidade || props.local || props.bioma || props.uf || '';
          if (tooltipText) {
            leafletLayer.bindTooltip(String(tooltipText), {
              sticky: true,
              className: 'bg-slate-900 text-white text-xs border border-slate-700 px-2 py-1 rounded-md shadow-lg'
            });
          }

          // Feature click handler
          leafletLayer.on('click', (e: L.LeafletMouseEvent) => {
            if (onFeatureClick) {
              onFeatureClick(feature, layer.id, featureIndex);
            }
            if (onOpenFeatureInspector) {
              onOpenFeatureInspector(feature, layer.id, featureIndex);
            }
          });
        }
      };
      const geoJsonLayer = L.geoJSON(filteredCollection, geoJsonOptions);

      geoJsonLayer.addTo(map);
      vectorLayersRef.current.set(layer.id, geoJsonLayer);
    });
  }, [layers, getFeatureStyle, createPopupContent, onFeatureClick, onOpenFeatureInspector]);

  // Handle Feature Selection & Highlighting (non-interactive to avoid blocking clicks)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (highlightLayerRef.current) {
      map.removeLayer(highlightLayerRef.current);
      highlightLayerRef.current = null;
    }

    if (selectedFeature) {
      const hlLayer = L.geoJSON(selectedFeature, {
        interactive: false,
        style: {
          color: '#38bdf8',
          weight: 4,
          fillColor: '#38bdf8',
          fillOpacity: 0.35,
          dashArray: '4, 4'
        },
        pointToLayer: (f, latlng) => {
          return L.circleMarker(latlng, {
            radius: 12,
            fillColor: '#38bdf8',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 0.9
          });
        }
      }).addTo(map);

      highlightLayerRef.current = hlLayer;
      
      try {
        const bounds = hlLayer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.5 });
        }
      } catch (e) {
        console.warn('Could not fit bounds to selected feature', e);
      }
    }
  }, [selectedFeature]);

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 13, { duration: 1.5 });
        L.circleMarker([latitude, longitude], {
          radius: 10,
          fillColor: '#38bdf8',
          color: '#ffffff',
          weight: 3,
          fillOpacity: 0.9
        }).addTo(mapInstanceRef.current!).bindPopup('<b>Sua localização atual</b>').openPopup();
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
      }
    );
  };

  const handleResetExtent = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layers.length > 0) {
      const validLayers = layers.filter(l => l.visible && l.data.features.length > 0);
      if (validLayers.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        validLayers.forEach(l => {
          minX = Math.min(minX, l.bbox[0]);
          minY = Math.min(minY, l.bbox[1]);
          maxX = Math.max(maxX, l.bbox[2]);
          maxY = Math.max(maxY, l.bbox[3]);
        });
        if (minX !== Infinity) {
          map.fitBounds([[minY, minX], [maxY, maxX]], { padding: [40, 40] });
          return;
        }
      }
    }
    map.flyTo([-14.235, -51.925], 4);
  };

  useEffect(() => {
    if (fitBoundsTrigger && fitBoundsTrigger > 0) {
      const map = mapInstanceRef.current;
      if (!map) return;

      const validLayers = layers.filter(l => l.visible && l.data.features.length > 0);
      if (validLayers.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        validLayers.forEach(l => {
          const filtered = filterFeatures(l.data.features, l.filters, l.spatialFilter);
          if (filtered.length > 0) {
            const bbox = calculateBoundingBox(filtered);
            minX = Math.min(minX, bbox[0]);
            minY = Math.min(minY, bbox[1]);
            maxX = Math.max(maxX, bbox[2]);
            maxY = Math.max(maxY, bbox[3]);
          }
        });

        if (minX !== Infinity) {
          map.fitBounds([[minY, minX], [maxY, maxX]], { padding: [40, 40], maxZoom: 16 });
        }
      }
    }
  }, [fitBoundsTrigger]);

  // Coherent metrics calculation for Top-Left HUD (Nº DE LOTES UNIDADES HABITACIONAIS & ÁREA TOTAL DA GLEBA/M²)
  const mapMetrics = useMemo(() => {
    const visibleFeatures: GeoJSON.Feature[] = [];
    layers.filter(l => l.visible).forEach(l => {
      if (l.data && l.data.features) {
        const filtered = filterFeatures(l.data.features, l.filters, l.spatialFilter);
        visibleFeatures.push(...filtered);
      }
    });
    return extractFeaturesMetrics(visibleFeatures);
  }, [layers]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Leaflet DOM container */}
      <div id="map-container" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Minimal Floating Spatial Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-xs">
        <button
          onClick={handleLocateMe}
          className="p-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Minha Localização GPS"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetExtent}
          className="p-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Enquadrar todas as camadas"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Coordinate / Zoom HUD */}
      <div className="absolute bottom-3 left-3 z-30 hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 backdrop-blur-xs shadow-lg">
        {mouseCoords ? (
          <div>
            <span className="text-slate-500">Lat:</span>{' '}
            <strong className="text-slate-200">{mouseCoords.lat > 0 ? `+${mouseCoords.lat}` : mouseCoords.lat}°</strong>{' '}
            <span className="text-slate-500">Lng:</span>{' '}
            <strong className="text-slate-200">{mouseCoords.lng > 0 ? `+${mouseCoords.lng}` : mouseCoords.lng}°</strong>
          </div>
        ) : (
          <span>Mova o cursor sobre o mapa</span>
        )}
        <span>•</span>
        <div>
          <span className="text-slate-500">Zoom:</span> <strong className="text-sky-400">{currentZoom}</strong>
        </div>
        <span>•</span>
        <div className="text-slate-400">
          EPSG:4326 (WGS84)
        </div>
      </div>
    </div>
  );
};
