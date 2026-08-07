import proj4 from 'proj4';

// Map EPSG code to Proj4 definition strings
// Standard VN2000 uses ellipsoid WGS84, Transverse Mercator projection.
// It maps to proj4 parameter structure: +proj=tmerc +lat_0=0 +lon_0=<central_meridian> +k=<scale_factor> +x_0=500000 +y_0=0 +ellps=WGS84 +units=m +no_defs
export function getProj4Definition(epsg: number): string | null {
  const vn2000Meridians: Record<number, number> = {
    9214: 105.75, // TP.HCM
    5899: 105.00, // Hà Nội
    10575: 105.75, // Long An
  };

  if (vn2000Meridians[epsg] !== undefined) {
    const lon0 = vn2000Meridians[epsg];
    return `+proj=tmerc +lat_0=0 +lon_0=${lon0} +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.9,-39.3,-111,0,0,0,0 +units=m +no_defs`;
  }

  // WGS84 UTM Zone 48N (EPSG:32648) or 49N (EPSG:32649)
  if (epsg === 32648) {
    return "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs";
  }
  if (epsg === 32649) {
    return "+proj=utm +zone=49 +datum=WGS84 +units=m +no_defs";
  }

  return null;
}

/**
 * Parses and unifies coordinate systems (VN2000 / Google Maps Lat-Long) and auto-corrects copy-paste swaps.
 */
export function parseAndUnifyCoordinates(val1: number, val2: number, epsg: number) {
  let x = val1;
  let y = val2;

  // 1. Detect if geographic coordinates (degrees, like Google Maps)
  const isGeographic = (Math.abs(x) <= 180 && Math.abs(y) <= 90) || (Math.abs(y) <= 180 && Math.abs(x) <= 90);

  if (isGeographic) {
    // If x (Lon field) < 90 and y (Lat field) > 90, they are swapped (Latitude entered into Longitude field)
    if (x < 90 && y > 90) {
      const temp = x;
      x = y;
      y = temp;
    }
    return { lon: x, lat: y, isConverted: false };
  }

  // 2. Projected coordinates (meters, VN2000/UTM)
  // Easting (Lon field) is smaller (100k - 900k) than Northing (Lat field) (900k - 2.8M).
  // If x is larger than y, they are swapped.
  if (x > y) {
    const temp = x;
    x = y;
    y = temp;
  }

  const projDefinition = getProj4Definition(epsg);
  if (!projDefinition) {
    // Fallback: Default to VN2000 TP.HCM (EPSG:9214) if unknown
    const defaultDef = `+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.9,-39.3,-111,0,0,0,0 +units=m +no_defs`;
    try {
      const [lon, lat] = proj4(defaultDef, 'EPSG:4326', [x, y]);
      return { lon, lat, isConverted: true, fallback: true };
    } catch (e) {
      return { lon: x, lat: y, isConverted: false, error: true };
    }
  }

  try {
    const [lon, lat] = proj4(projDefinition, 'EPSG:4326', [x, y]);
    return { lon, lat, isConverted: true };
  } catch (e) {
    return { lon: x, lat: y, isConverted: false, error: true };
  }
}
