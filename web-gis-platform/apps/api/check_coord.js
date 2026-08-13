const x = -1733266.1968081933;
const y = 6020423.6957495175;
const z = 1192176.1794611244;

const a = 6378137.0; // semi-major axis
const b = 6356752.314245; // semi-minor axis
const f = (a - b) / a;
const e2 = (2 * f) - (f * f); // eccentricity squared

const r = Math.sqrt(x*x + y*y);
let lat = Math.atan2(z, r * (1 - e2));
let lon = Math.atan2(y, x);
let h = 0;

for (let i = 0; i < 5; i++) {
  const N = a / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));
  h = r / Math.cos(lat) - N;
  lat = Math.atan2(z, r * (1 - e2 * (N / (N + h))));
}

const latDeg = lat * 180 / Math.PI;
const lonDeg = lon * 180 / Math.PI;

console.log("LLA Coordinates of SHTP Nursery Tileset:");
console.log(`Longitude: ${lonDeg}`);
console.log(`Latitude: ${latDeg}`);
console.log(`Height: ${h}`);
