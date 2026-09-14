import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';

export const PROJECT_ID = '6ce58968-25d2-4910-9ca8-43f5c078ca5b';
export const PUBLIC_BASE = 'https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev';
export const SOURCE_KEY = `projects/${PROJECT_ID}/model.glb`;
export const LEGACY_URL = `${PUBLIC_BASE}/${SOURCE_KEY}`;
export const KNOWN_SOURCE = {
  size: 34_636_576,
  sha256: '43f104d1df00b13f96c114a06a8cfab0f225a55ef0f1cd9ebd7f6a483536f264'
};
const CONTENT_TYPE = 'model/gltf-binary';
const CACHE_CONTROL = 'public,max-age=31536000,immutable';

export function createPlan(version: string = randomUUID()) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(version)) {
    throw new Error('--version must be a lowercase UUID v4.');
  }
  const destinationKey = `projects/${PROJECT_ID}/versions/${version}/model.glb`;
  const destinationUrl = `${PUBLIC_BASE}/${destinationKey}`;
  return {
    projectId: PROJECT_ID,
    sourceKey: SOURCE_KEY,
    sourceUrl: LEGACY_URL,
    expectedSource: KNOWN_SOURCE,
    version,
    destinationKey,
    destinationUrl,
    contentType: CONTENT_TYPE,
    cacheControl: CACHE_CONTROL,
    cas: { where: { id: PROJECT_ID, modelUrl: LEGACY_URL }, data: { modelUrl: destinationUrl } },
    applyCommand: `${process.platform === 'win32' ? 'npx.cmd' : 'npx'} tsx src/scripts/migrateLongPhuModelCache.ts --apply --approve-project ${PROJECT_ID} --version ${version}`
  };
}

export function fingerprint(bytes: Buffer) {
  return { size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

type Plan = ReturnType<typeof createPlan>;
type ObjectData = {
  bytes: Buffer;
  contentLength?: number;
  contentType?: string;
  cacheControl?: string;
};
export interface MigrationIO {
  readSource(): Promise<Buffer>;
  currentModelUrl(): Promise<string | null | undefined>;
  createDestination(key: string, bytes: Buffer): Promise<void>;
  readDestination(key: string): Promise<ObjectData>;
  readPublicDestination(url: string): Promise<ObjectData>;
  compareAndSet(update: Plan['cas']): Promise<number>;
  log?(stage: string, data: unknown): void;
}

function assertFingerprint(actual: ReturnType<typeof fingerprint>, expected: typeof KNOWN_SOURCE, label: string) {
  if (actual.size !== expected.size || actual.sha256 !== expected.sha256) {
    throw new Error(`${label} size/SHA-256 mismatch: ${JSON.stringify(actual)}; DB unchanged.`);
  }
}

function verifyDestination(object: ObjectData, source: typeof KNOWN_SOURCE) {
  const actual = fingerprint(object.bytes);
  assertFingerprint(actual, source, 'Destination');
  // Ignore directive order/whitespace, but reject conflicting/additional cache directives.
  const directives = (object.cacheControl ?? '').toLowerCase().split(',').map(s => s.trim()).sort().join(',');
  if (object.contentLength !== source.size || object.contentType !== CONTENT_TYPE ||
      directives !== CACHE_CONTROL.split(',').sort().join(',')) {
    throw new Error('Destination Content-Length/Content-Type/Cache-Control mismatch; DB unchanged.');
  }
  return { ...actual, contentType: object.contentType, cacheControl: object.cacheControl };
}

export async function migrate(plan: Plan, io: MigrationIO, apply = false) {
  // Default dry-run never connects to the DB or invokes a write operation.
  if (apply && await io.currentModelUrl() !== plan.sourceUrl) {
    throw new Error('DB no longer points to the exact legacy URL; no upload performed.');
  }
  const bytes = await io.readSource();
  const source = fingerprint(bytes);
  assertFingerprint(source, plan.expectedSource, 'Source');
  io.log?.('source-verified', source);
  if (!apply) return { mode: 'dry-run', plan, source, destination: 'NOT CREATED / NOT VERIFIED', db: 'NOT READ / NOT UPDATED' };

  io.log?.('creating-destination', { key: plan.destinationKey });
  await io.createDestination(plan.destinationKey, bytes);
  const destination = verifyDestination(await io.readDestination(plan.destinationKey), source);
  io.log?.('r2-destination-verified', destination);
  // Also prove the exact URL the Viewer will use serves the same bytes and cache headers.
  const publicDestination = verifyDestination(await io.readPublicDestination(plan.destinationUrl), source);
  io.log?.('public-destination-verified', publicDestination);
  const updated = await io.compareAndSet(plan.cas);
  if (updated !== 1) {
    throw new Error(`CAS conflict: ${updated} rows updated. Destination retained at ${plan.destinationUrl}; no retry or cleanup.`);
  }
  io.log?.('db-cas-updated', { count: updated });
  return { mode: 'applied', plan, source, destination, publicDestination, updated };
}

async function readPublicObject(url: string): Promise<ObjectData> {
  const response = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(120_000) });
  if (response.status !== 200) {
    await response.body?.cancel();
    throw new Error(`Public GET returned HTTP ${response.status}: ${url}`);
  }
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentLength: Number(response.headers.get('content-length')),
    contentType: response.headers.get('content-type') ?? undefined,
    cacheControl: response.headers.get('cache-control') ?? undefined
  };
}

export function parseOptions(args: string[]) {
  const { values } = parseArgs({ args, allowPositionals: false, options: {
    apply: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    'approve-project': { type: 'string' },
    version: { type: 'string' },
    'source-file': { type: 'string' }
  } });
  if (values.apply && (values['dry-run'] || values['source-file'] || values['approve-project'] !== PROJECT_ID || !values.version)) {
    throw new Error('--apply requires --approve-project and the reviewed --version; --dry-run/--source-file cannot be combined with it.');
  }
  return values;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const plan = createPlan(options.version);
  dotenv.config({ quiet: true });
  const log = (stage: string, data: unknown) => console.error(`[ModelCacheMigration] ${stage}`, JSON.stringify(data));
  if (!options.apply) {
    const forbidden = async (): Promise<never> => { throw new Error('Dry-run cannot access R2 writes or DB.'); };
    const result = await migrate(plan, {
      readSource: async () => options['source-file']
        ? readFile(options['source-file'])
        : (await readPublicObject(LEGACY_URL)).bytes,
      currentModelUrl: forbidden, createDestination: forbidden, readDestination: forbidden,
      readPublicDestination: forbidden, compareAndSet: forbidden, log
    });
    console.log(JSON.stringify({ ...result, sourceRead: options['source-file'] ? 'local audit copy (not a fresh R2 read)' : LEGACY_URL }, null, 2));
    return;
  }

  const required = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL', 'DATABASE_URL'];
  const missing = required.filter(name => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}; no upload or DB mutation performed.`);
  if (process.env.R2_PUBLIC_URL!.replace(/\/$/, '') !== PUBLIC_BASE) {
    throw new Error('R2_PUBLIC_URL must match the audited legacy origin; custom-domain migration is out of scope.');
  }
  // Import the existing R2 service only after explicit execution/configuration checks.
  const { readFileFromR2, createVersionedModelInR2 } = await import('../r2Service');
  const { PrismaClient } = await import('../generated/prisma/client');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const result = await migrate(plan, {
      readSource: async () => (await readFileFromR2(SOURCE_KEY)).bytes,
      currentModelUrl: async () => (await prisma.project.findUnique({
        where: { id: PROJECT_ID }, select: { modelUrl: true }
      }))?.modelUrl,
      createDestination: createVersionedModelInR2,
      readDestination: readFileFromR2,
      readPublicDestination: readPublicObject,
      compareAndSet: async update => (await prisma.project.updateMany(update)).count,
      log
    }, true);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(`[ModelCacheMigration] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
