export type PointCloudSource =
  | { kind: 'direct-url'; url: string }
  | { kind: 'custom-index'; url: string }
  | { kind: 'ion-asset'; assetId: number }
  | { kind: 'unsupported' };

export type CopcTilesIndex = {
  type: 'copc-tiles';
  tiles: unknown[];
};

const hasDirectUrlPrefix = (source: string): boolean =>
  source.startsWith('http') || source.startsWith('/');

export const isDirectTilesetUrl = (source: string): boolean =>
  hasDirectUrlPrefix(source) && source.endsWith('tileset.json');

export const isDirectPointCloudUrl = (source: string): boolean =>
  hasDirectUrlPrefix(source) &&
  (source.endsWith('tileset.json') || source.endsWith('.laz') || source.endsWith('.copc.laz'));

export const isCustomPointCloudIndexUrl = (source: string): boolean =>
  hasDirectUrlPrefix(source) && source.endsWith('index.json');

export function classifyPointCloudSource(source: string): PointCloudSource {
  if (isDirectPointCloudUrl(source)) return { kind: 'direct-url', url: source };
  if (isCustomPointCloudIndexUrl(source)) return { kind: 'custom-index', url: source };

  const assetId = parseInt(source);
  return !isNaN(assetId) ? { kind: 'ion-asset', assetId } : { kind: 'unsupported' };
}

export const isCopcTilesIndex = (value: unknown): value is CopcTilesIndex => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; tiles?: unknown };
  return candidate.type === 'copc-tiles' && Array.isArray(candidate.tiles) && candidate.tiles.length > 0;
};

export const getPointCloudIndexBaseUrl = (indexUrl: string): string =>
  indexUrl.substring(0, indexUrl.lastIndexOf('/') + 1);

export const resolvePointCloudTileUrl = (baseUrl: string, tileName: unknown): string =>
  baseUrl + tileName;

export const appendDomCacheBust = (source: string, timestamp: number): string =>
  source + '?cb=' + timestamp;
