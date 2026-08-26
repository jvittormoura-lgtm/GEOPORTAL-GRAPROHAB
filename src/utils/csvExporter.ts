import Papa from 'papaparse';

export function geometryToWkt(geom: GeoJSON.Geometry): string {
  if (!geom) return '';
  
  if (geom.type === 'Point') {
    const [lng, lat] = geom.coordinates;
    return `POINT (${lng} ${lat})`;
  } else if (geom.type === 'MultiPoint') {
    const pts = geom.coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
    return `MULTIPOINT (${pts})`;
  } else if (geom.type === 'LineString') {
    const pts = geom.coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
    return `LINESTRING (${pts})`;
  } else if (geom.type === 'MultiLineString') {
    const lines = geom.coordinates.map(line => `(${line.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})`).join(', ');
    return `MULTILINESTRING (${lines})`;
  } else if (geom.type === 'Polygon') {
    const rings = geom.coordinates.map(ring => `(${ring.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})`).join(', ');
    return `POLYGON (${rings})`;
  } else if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates.map(poly => `(${poly.map(ring => `(${ring.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})`).join(', ')})`).join(', ');
    return `MULTIPOLYGON (${polys})`;
  }
  return '';
}

export function exportToCsv(
  geojson: GeoJSON.FeatureCollection,
  includeWkt: boolean = true,
  includeLatLon: boolean = true
): string {
  const features = geojson.features;
  if (!features || features.length === 0) {
    return 'id,geometry_type\n';
  }

  // Find all property keys
  const propKeys = new Set<string>();
  features.forEach(f => {
    if (f.properties) {
      Object.keys(f.properties).forEach(k => propKeys.add(k));
    }
  });

  const headers: string[] = [];
  if (includeLatLon) {
    headers.push('latitude', 'longitude');
  }
  headers.push('geometry_type');
  if (includeWkt) {
    headers.push('geometry_wkt');
  }
  headers.push(...Array.from(propKeys));

  const rows = features.map((f, idx) => {
    const row: Record<string, any> = {};
    const geom = f.geometry;

    if (includeLatLon) {
      if (geom && geom.type === 'Point') {
        row['longitude'] = geom.coordinates[0];
        row['latitude'] = geom.coordinates[1];
      } else if (geom && geom.type === 'MultiPoint' && geom.coordinates[0]) {
        row['longitude'] = geom.coordinates[0][0];
        row['latitude'] = geom.coordinates[0][1];
      } else {
        row['longitude'] = '';
        row['latitude'] = '';
      }
    }

    row['geometry_type'] = geom ? geom.type : 'Unknown';

    if (includeWkt && geom) {
      row['geometry_wkt'] = geometryToWkt(geom);
    }

    const props = f.properties || {};
    propKeys.forEach(k => {
      const val = props[k];
      if (val !== null && typeof val === 'object') {
        row[k] = JSON.stringify(val);
      } else {
        row[k] = val !== undefined && val !== null ? val : '';
      }
    });

    return row;
  });

  return Papa.unparse({
    fields: headers,
    data: rows
  });
}
