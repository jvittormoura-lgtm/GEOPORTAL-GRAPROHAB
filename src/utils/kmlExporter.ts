import { GisLayer } from '../types/gis';

function escapeXml(unsafe: string | number | boolean | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hexToKmlColor(hex: string, opacity: number = 1): string {
  // KML color format is aabbggrr
  const cleanHex = hex.replace('#', '');
  let r = '00', g = '00', b = '00';
  if (cleanHex.length === 6) {
    r = cleanHex.substring(0, 2);
    g = cleanHex.substring(2, 4);
    b = cleanHex.substring(4, 6);
  } else if (cleanHex.length === 3) {
    r = cleanHex[0] + cleanHex[0];
    g = cleanHex[1] + cleanHex[1];
    b = cleanHex[2] + cleanHex[2];
  }
  const a = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${a}${b}${g}${r}`;
}

export function exportToKml(
  geojson: GeoJSON.FeatureCollection,
  layer?: Partial<GisLayer>,
  documentName: string = 'GeoMap Layer'
): string {
  const features = geojson.features.filter(f => f && f.geometry);
  
  const strokeColor = layer?.style?.strokeColor || '#2563eb';
  const fillColor = layer?.style?.fillColor || '#3b82f6';
  const strokeWidth = layer?.style?.strokeWidth || 2;
  const fillOpacity = layer?.style?.fillOpacity ?? 0.5;
  const strokeOpacity = layer?.style?.strokeOpacity ?? 1;

  const kmlLineColor = hexToKmlColor(strokeColor, strokeOpacity);
  const kmlPolyColor = hexToKmlColor(fillColor, fillOpacity);

  let placemarksXml = '';

  features.forEach((feature, idx) => {
    const props = feature.properties || {};
    const featureName = props.name || props.nome || props.NAME || props.title || props.id || `Feição #${idx + 1}`;
    
    // Generate ExtendedData
    let extendedDataXml = '<ExtendedData>';
    Object.entries(props).forEach(([k, v]) => {
      extendedDataXml += `\n        <Data name="${escapeXml(k)}"><value>${escapeXml(v)}</value></Data>`;
    });
    extendedDataXml += '\n      </ExtendedData>';

    // Build geometry XML
    let geomXml = '';
    const geom = feature.geometry;

    if (geom.type === 'Point') {
      const [lng, lat, alt] = geom.coordinates;
      geomXml = `
      <Point>
        <coordinates>${lng},${lat},${alt || 0}</coordinates>
      </Point>`;
    } else if (geom.type === 'MultiPoint') {
      geomXml = '\n      <MultiGeometry>';
      geom.coordinates.forEach(([lng, lat, alt]) => {
        geomXml += `\n        <Point><coordinates>${lng},${lat},${alt || 0}</coordinates></Point>`;
      });
      geomXml += '\n      </MultiGeometry>';
    } else if (geom.type === 'LineString') {
      const coordStr = geom.coordinates.map(c => `${c[0]},${c[1]},${c[2] || 0}`).join(' ');
      geomXml = `
      <LineString>
        <coordinates>${coordStr}</coordinates>
      </LineString>`;
    } else if (geom.type === 'MultiLineString') {
      geomXml = '\n      <MultiGeometry>';
      geom.coordinates.forEach(line => {
        const coordStr = line.map(c => `${c[0]},${c[1]},${c[2] || 0}`).join(' ');
        geomXml += `\n        <LineString><coordinates>${coordStr}</coordinates></LineString>`;
      });
      geomXml += '\n      </MultiGeometry>';
    } else if (geom.type === 'Polygon') {
      const outerRing = geom.coordinates[0].map(c => `${c[0]},${c[1]},${c[2] || 0}`).join(' ');
      let innerRingsXml = '';
      for (let i = 1; i < geom.coordinates.length; i++) {
        const innerCoord = geom.coordinates[i].map(c => `${c[0]},${c[1]},${c[2] || 0}`).join(' ');
        innerRingsXml += `
        <innerBoundaryIs>
          <LinearRing><coordinates>${innerCoord}</coordinates></LinearRing>
        </innerBoundaryIs>`;
      }
      geomXml = `
      <Polygon>
        <outerBoundaryIs>
          <LinearRing><coordinates>${outerRing}</coordinates></LinearRing>
        </outerBoundaryIs>${innerRingsXml}
      </Polygon>`;
    } else if (geom.type === 'MultiPolygon') {
      geomXml = '\n      <MultiGeometry>';
      geom.coordinates.forEach(poly => {
        const outerRing = poly[0].map(c => `${c[0]},${c[1]},${c[2] || 0}`).join(' ');
        geomXml += `
        <Polygon>
          <outerBoundaryIs>
            <LinearRing><coordinates>${outerRing}</coordinates></LinearRing>
          </outerBoundaryIs>
        </Polygon>`;
      });
      geomXml += '\n      </MultiGeometry>';
    }

    placemarksXml += `
    <Placemark>
      <name>${escapeXml(featureName)}</name>
      <styleUrl>#defaultStyle</styleUrl>
      ${extendedDataXml}
      ${geomXml}
    </Placemark>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(documentName)}</name>
    <Style id="defaultStyle">
      <LineStyle>
        <color>${kmlLineColor}</color>
        <width>${strokeWidth}</width>
      </LineStyle>
      <PolyStyle>
        <color>${kmlPolyColor}</color>
        <fill>1</fill>
        <outline>1</outline>
      </PolyStyle>
      <IconStyle>
        <color>${kmlLineColor}</color>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    ${placemarksXml}
  </Document>
</kml>`;
}
