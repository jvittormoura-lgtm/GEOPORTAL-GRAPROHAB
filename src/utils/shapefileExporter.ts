import JSZip from 'jszip';


const SIRGAS2000_PRJ = `GEOGCS["SIRGAS_2000",DATUM["Sistema_de_Referencia_Geocentrico_para_las_AmericaS_2000",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`;

export async function exportToShapefileZip(
  geojson: GeoJSON.FeatureCollection,
  baseName: string = 'export'
): Promise<Blob> {
  const zip = new JSZip();

  // Normalize features
  const features = geojson.features.filter(f => f && f.geometry);
  if (features.length === 0) {
    throw new Error('Não há feições com geometrias válidas para exportar.');
  }

  // Detect dominant geometry type: Point (1), PolyLine (3), Polygon (5)
  const firstType = features[0].geometry.type;
  let shapeType = 1; // Point
  if (firstType === 'LineString' || firstType === 'MultiLineString') {
    shapeType = 3;
  } else if (firstType === 'Polygon' || firstType === 'MultiPolygon') {
    shapeType = 5;
  } else if (firstType === 'Point' || firstType === 'MultiPoint') {
    shapeType = 1;
  }

  // Build fields definition for DBF
  const propKeys = new Set<string>();
  features.forEach(f => {
    if (f.properties) {
      Object.keys(f.properties).forEach(k => propKeys.add(k));
    }
  });

  const fields: { name: string; type: 'C' | 'N'; length: number; decimal: number }[] = [];
  const fieldKeyMap = new Map<string, string>(); // sanitized 10-char name -> original key
  let fieldIdx = 0;

  for (const key of Array.from(propKeys)) {
    let sanitized = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 10);
    if (!sanitized) sanitized = `FLD_${fieldIdx}`;
    
    // Check duplicates
    let uniqueName = sanitized;
    let dupCount = 1;
    while (fields.some(f => f.name.toLowerCase() === uniqueName.toLowerCase())) {
      uniqueName = `${sanitized.substring(0, 8)}_${dupCount++}`;
    }
    fieldKeyMap.set(uniqueName, key);

    // Detect type
    let isNumeric = true;
    let hasDecimals = false;
    let maxLen = 1;

    for (const f of features) {
      const val = f.properties ? f.properties[key] : null;
      if (val !== null && val !== undefined && val !== '') {
        if (typeof val === 'number') {
          if (!Number.isInteger(val)) hasDecimals = true;
          maxLen = Math.max(maxLen, String(val).length);
        } else {
          isNumeric = false;
          maxLen = Math.max(maxLen, String(val).length);
        }
      }
    }

    if (isNumeric && maxLen > 0) {
      fields.push({
        name: uniqueName,
        type: 'N',
        length: Math.min(18, Math.max(maxLen + 2, 10)),
        decimal: hasDecimals ? 4 : 0
      });
    } else {
      fields.push({
        name: uniqueName,
        type: 'C',
        length: Math.min(254, Math.max(maxLen, 16)),
        decimal: 0
      });
    }
    fieldIdx++;
    if (fields.length >= 128) break; // DBF limit safeguard
  }

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const extractCoords = (coords: any): [number, number][] => {
    if (!Array.isArray(coords)) return [];
    if (typeof coords[0] === 'number') return [coords as [number, number]];
    return coords.flatMap(extractCoords);
  };

  features.forEach(f => {
    const coords = extractCoords(f.geometry);
    coords.forEach(([x, y]) => {
      if (typeof x === 'number' && typeof y === 'number') {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    });
  });

  if (minX === Infinity) {
    minX = -180; minY = -90; maxX = 180; maxY = 90;
  }

  // 1. Build .shp and .shx buffers
  const shpRecords: Uint8Array[] = [];
  const shxRecords: { offset: number; length: number }[] = [];

  let currentShpOffsetWords = 50; // 100 bytes = 50 16-bit words

  features.forEach((feature, index) => {
    const recordNum = index + 1;
    const geom = feature.geometry;
    let recordContent: Uint8Array;

    if (shapeType === 1) {
      // Point
      let x = 0, y = 0;
      if (geom.type === 'Point') {
        [x, y] = geom.coordinates;
      } else if (geom.type === 'MultiPoint' && geom.coordinates[0]) {
        [x, y] = geom.coordinates[0];
      }
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      view.setInt32(0, 1, true); // ShapeType 1 (Little Endian)
      view.setFloat64(4, x, true);
      view.setFloat64(12, y, true);
      recordContent = new Uint8Array(buffer);
    } else if (shapeType === 3 || shapeType === 5) {
      // PolyLine (3) or Polygon (5)
      let rings: [number, number][][] = [];
      if (geom.type === 'LineString') {
        rings = [geom.coordinates as [number, number][]];
      } else if (geom.type === 'MultiLineString') {
        rings = geom.coordinates as [number, number][][];
      } else if (geom.type === 'Polygon') {
        rings = geom.coordinates as [number, number][][];
      } else if (geom.type === 'MultiPolygon') {
        rings = geom.coordinates.flat() as [number, number][][];
      }

      const numParts = Math.max(1, rings.length);
      const allPoints = rings.flat();
      const numPoints = allPoints.length;

      let rMinX = Infinity, rMinY = Infinity, rMaxX = -Infinity, rMaxY = -Infinity;
      allPoints.forEach(([px, py]) => {
        rMinX = Math.min(rMinX, px);
        rMinY = Math.min(rMinY, py);
        rMaxX = Math.max(rMaxX, px);
        rMaxY = Math.max(rMaxY, py);
      });
      if (rMinX === Infinity) { rMinX = 0; rMinY = 0; rMaxX = 0; rMaxY = 0; }

      const contentSize = 44 + (numParts * 4) + (numPoints * 16);
      const buffer = new ArrayBuffer(contentSize);
      const view = new DataView(buffer);

      view.setInt32(0, shapeType, true); // ShapeType
      view.setFloat64(4, rMinX, true);
      view.setFloat64(12, rMinY, true);
      view.setFloat64(20, rMaxX, true);
      view.setFloat64(28, rMaxY, true);
      view.setInt32(36, numParts, true);
      view.setInt32(40, numPoints, true);

      let pointOffset = 0;
      let partByteOffset = 44;
      rings.forEach(ring => {
        view.setInt32(partByteOffset, pointOffset, true);
        partByteOffset += 4;
        pointOffset += ring.length;
      });

      let ptsByteOffset = 44 + (numParts * 4);
      allPoints.forEach(([px, py]) => {
        view.setFloat64(ptsByteOffset, px, true);
        view.setFloat64(ptsByteOffset + 8, py, true);
        ptsByteOffset += 16;
      });

      recordContent = new Uint8Array(buffer);
    } else {
      // Fallback Null Shape (0)
      const buffer = new ArrayBuffer(4);
      new DataView(buffer).setInt32(0, 0, true);
      recordContent = new Uint8Array(buffer);
    }

    const contentLenBytes = recordContent.byteLength;
    const contentLenWords = contentLenBytes / 2;

    // Record header: 8 bytes
    const recHeader = new ArrayBuffer(8);
    const recView = new DataView(recHeader);
    recView.setInt32(0, recordNum, false); // Big Endian
    recView.setInt32(4, contentLenWords, false); // Big Endian

    const fullRecord = new Uint8Array(8 + contentLenBytes);
    fullRecord.set(new Uint8Array(recHeader), 0);
    fullRecord.set(recordContent, 8);
    shpRecords.push(fullRecord);

    shxRecords.push({
      offset: currentShpOffsetWords,
      length: contentLenWords
    });

    currentShpOffsetWords += (4 + contentLenWords);
  });

  // Calculate total SHP file length in 16-bit words
  const totalShpLengthWords = currentShpOffsetWords;
  const totalShxLengthWords = 50 + (shxRecords.length * 4);

  // Write SHP Header (100 bytes)
  const shpHeader = new ArrayBuffer(100);
  const shpHeadView = new DataView(shpHeader);
  shpHeadView.setInt32(0, 9994, false); // File code
  shpHeadView.setInt32(24, totalShpLengthWords, false); // File length
  shpHeadView.setInt32(28, 1000, true); // Version 1000
  shpHeadView.setInt32(32, shapeType, true); // Shape type
  shpHeadView.setFloat64(36, minX, true);
  shpHeadView.setFloat64(44, minY, true);
  shpHeadView.setFloat64(52, maxX, true);
  shpHeadView.setFloat64(60, maxY, true);

  // Assemble complete SHP
  const shpBlobParts: Uint8Array[] = [new Uint8Array(shpHeader), ...shpRecords];
  const shpBlob = new Blob(shpBlobParts as BlobPart[]);

  // Write SHX Header (100 bytes) + records
  const shxHeader = new ArrayBuffer(100);
  const shxHeadView = new DataView(shxHeader);
  shxHeadView.setInt32(0, 9994, false);
  shxHeadView.setInt32(24, totalShxLengthWords, false);
  shxHeadView.setInt32(28, 1000, true);
  shxHeadView.setInt32(32, shapeType, true);
  shxHeadView.setFloat64(36, minX, true);
  shxHeadView.setFloat64(44, minY, true);
  shxHeadView.setFloat64(52, maxX, true);
  shxHeadView.setFloat64(60, maxY, true);

  const shxContent = new ArrayBuffer(shxRecords.length * 8);
  const shxContentView = new DataView(shxContent);
  shxRecords.forEach((rec, i) => {
    shxContentView.setInt32(i * 8, rec.offset, false);
    shxContentView.setInt32(i * 8 + 4, rec.length, false);
  });

  const shxBlob = new Blob([shxHeader, shxContent]);

  // 2. Build .dbf File
  const recordLength = 1 + fields.reduce((acc, f) => acc + f.length, 0);
  const headerLength = 32 + (fields.length * 32) + 1;
  const numDbfRecords = features.length;

  const dbfHeaderBuf = new ArrayBuffer(headerLength);
  const dbfHeadView = new DataView(dbfHeaderBuf);
  const date = new Date();

  dbfHeadView.setUint8(0, 0x03); // dBASE III without memo
  dbfHeadView.setUint8(1, date.getFullYear() - 1900);
  dbfHeadView.setUint8(2, date.getMonth() + 1);
  dbfHeadView.setUint8(3, date.getDate());
  dbfHeadView.setUint32(4, numDbfRecords, true);
  dbfHeadView.setUint16(8, headerLength, true);
  dbfHeadView.setUint16(10, recordLength, true);

  // Field descriptors
  let offset = 32;
  const encoder = new TextEncoder();
  fields.forEach(field => {
    const nameBytes = encoder.encode(field.name);
    for (let i = 0; i < 11; i++) {
      dbfHeadView.setUint8(offset + i, i < nameBytes.length ? nameBytes[i] : 0);
    }
    dbfHeadView.setUint8(offset + 11, field.type.charCodeAt(0));
    dbfHeadView.setUint8(offset + 16, field.length);
    dbfHeadView.setUint8(offset + 17, field.decimal);
    offset += 32;
  });
  dbfHeadView.setUint8(headerLength - 1, 0x0D); // Header terminator

  // DBF records
  const dbfRecordsBuf = new Uint8Array(numDbfRecords * recordLength + 1);
  let recOffset = 0;

  features.forEach(f => {
    dbfRecordsBuf[recOffset++] = 0x20; // Deletion flag (not deleted)
    fields.forEach(field => {
      const origKey = fieldKeyMap.get(field.name) || field.name;
      const rawVal = f.properties ? f.properties[origKey] : '';
      let strVal = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';

      if (field.type === 'N') {
        strVal = strVal.padStart(field.length, ' ');
      } else {
        strVal = strVal.padEnd(field.length, ' ');
      }
      strVal = strVal.substring(0, field.length);
      const strBytes = encoder.encode(strVal);
      for (let b = 0; b < field.length; b++) {
        dbfRecordsBuf[recOffset++] = b < strBytes.length ? strBytes[b] : 0x20;
      }
    });
  });
  dbfRecordsBuf[recOffset] = 0x1A; // EOF

  const dbfBlob = new Blob([dbfHeaderBuf, dbfRecordsBuf]);

  // 3. Add to ZIP package
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'geodata';
  zip.file(`${cleanBase}.shp`, shpBlob);
  zip.file(`${cleanBase}.shx`, shxBlob);
  zip.file(`${cleanBase}.dbf`, dbfBlob);
  zip.file(`${cleanBase}.prj`, SIRGAS2000_PRJ);

  return await zip.generateAsync({ type: 'blob' });
}
