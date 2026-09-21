import assert from 'node:assert/strict';
import { test } from 'node:test';
import { S3Client } from '@aws-sdk/client-s3';
import {
  createPlan, fingerprint, migrate, parseOptions, PROJECT_ID, type MigrationIO
} from '../src/scripts/migrateLongPhuModelCache';
import { createVersionedModelInR2 } from '../src/r2Service';

const VERSION = '44c8e409-755a-43ab-8c28-c0bf77a4f036';
const source = Buffer.from('unchanged model bytes for migration sequencing tests');
function fixture(overrides: Partial<MigrationIO> = {}) {
  const plan = { ...createPlan(VERSION), expectedSource: fingerprint(source) };
  const calls: string[] = [];
  const object = {
    bytes: Buffer.from(source), contentLength: source.length,
    contentType: plan.contentType, cacheControl: 'public, max-age=31536000, immutable'
  };
  const io: MigrationIO = {
    currentModelUrl: async () => { calls.push('db-read'); return plan.sourceUrl; },
    readSource: async () => { calls.push('source'); return source; },
    createDestination: async (key, bytes) => {
      calls.push('put');
      assert.equal(key, plan.destinationKey);
      assert.deepEqual(bytes, source);
      assert.notEqual(key, plan.sourceKey);
    },
    readDestination: async () => { calls.push('r2-readback'); return object; },
    readPublicDestination: async url => {
      calls.push('public-readback'); assert.equal(url, plan.destinationUrl); return object;
    },
    compareAndSet: async update => {
      calls.push('cas');
      assert.deepEqual(update, { where: { id: PROJECT_ID, modelUrl: plan.sourceUrl }, data: { modelUrl: plan.destinationUrl } });
      return 1;
    },
    ...overrides
  };
  return { plan, calls, io, object };
}

test('default dry-run hashes source without reading DB, uploading or verifying an absent destination', async () => {
  const { plan, io, calls } = fixture();
  const result = await migrate(plan, io);
  assert.equal(result.mode, 'dry-run');
  assert.deepEqual(calls, ['source']);
});

test('CAS is reached only after authenticated and public destination bytes/headers are verified', async () => {
  const { plan, io, calls } = fixture();
  const result = await migrate(plan, io, true);
  assert.equal(result.mode, 'applied');
  assert.deepEqual(calls, ['db-read', 'source', 'put', 'r2-readback', 'public-readback', 'cas']);
});

test('a changed source hash stops before upload', async () => {
  const { plan, io, calls } = fixture();
  plan.expectedSource = { ...plan.expectedSource, sha256: '0'.repeat(64) };
  await assert.rejects(migrate(plan, io, true), /Source size\/SHA-256 mismatch/);
  assert.deepEqual(calls, ['db-read', 'source']);
});

test('an already changed project URL prevents upload', async () => {
  const { plan, io, calls } = fixture({ currentModelUrl: async () => 'https://example.com/new-model.glb' });
  await assert.rejects(migrate(plan, io, true), /no upload performed/);
  assert.deepEqual(calls, []);
});

for (const endpoint of ['readDestination', 'readPublicDestination'] as const) {
  for (const fault of ['same-size-corruption', 'truncation', 'wrong-cache', 'wrong-type', 'wrong-length'] as const) {
    test(`${endpoint}: ${fault} prevents DB update`, async () => {
      const { plan, io, calls, object } = fixture();
      const bad = { ...object, bytes: Buffer.from(object.bytes) };
      if (fault === 'same-size-corruption') bad.bytes[0] ^= 1;
      if (fault === 'truncation') bad.bytes = bad.bytes.subarray(1);
      if (fault === 'wrong-cache') bad.cacheControl = 'no-cache';
      if (fault === 'wrong-type') bad.contentType = 'application/octet-stream';
      if (fault === 'wrong-length') bad.contentLength++;
      io[endpoint] = async () => bad;
      await assert.rejects(migrate(plan, io, true), /Destination .*mismatch/);
      assert.equal(calls.includes('cas'), false);
    });
  }
}

test('a concurrent URL change between preflight and CAS is preserved, with no retry', async () => {
  let attempts = 0;
  let currentUrl = 'https://example.com/concurrent-model.glb';
  const { plan, io, calls } = fixture({ compareAndSet: async update => {
    attempts++;
    if (currentUrl !== update.where.modelUrl) return 0;
    currentUrl = update.data.modelUrl;
    return 1;
  } });
  await assert.rejects(migrate(plan, io, true), /CAS conflict: 0 rows updated/);
  assert.equal(currentUrl, 'https://example.com/concurrent-model.glb');
  assert.equal(attempts, 1);
  assert.equal(calls.filter(c => c === 'put').length, 1);
});

test('an existing destination or failed conditional write never reaches CAS', async () => {
  const { plan, io, calls } = fixture({ createDestination: async () => { throw new Error('PreconditionFailed'); } });
  await assert.rejects(migrate(plan, io, true), /PreconditionFailed/);
  assert.deepEqual(calls, ['db-read', 'source']);
});

test('CLI needs an explicit project approval and reviewed UUID, and never applies local cached bytes', () => {
  assert.equal(parseOptions([]).apply, false);
  for (const args of [
    ['--apply'],
    ['--apply', '--approve-project', 'other-project', '--version', VERSION],
    ['--apply', '--approve-project', PROJECT_ID],
    ['--apply', '--approve-project', PROJECT_ID, '--version', VERSION, '--dry-run'],
    ['--apply', '--approve-project', PROJECT_ID, '--version', VERSION, '--source-file', 'model.glb']
  ]) assert.throws(() => parseOptions(args), /--apply requires/);
  assert.equal(parseOptions(['--apply', '--approve-project', PROJECT_ID, '--version', VERSION]).apply, true);
  assert.throws(() => createPlan('../model.glb'), /UUID v4/);
  assert.throws(() => parseOptions(['--aply']), /Unknown option/);
});

test('the shared R2 service enforces create-only writes and refuses legacy/non-UUID paths', async () => {
  const original = S3Client.prototype.send;
  const requests: any[] = [];
  S3Client.prototype.send = (async (command: any) => {
    requests.push(command.input);
    // Simulate R2 rejecting a key that already exists.
    if (command.input.IfNoneMatch === '*') throw new Error('PreconditionFailed');
    throw new Error('Unsafe overwrite attempted');
  }) as typeof original;
  try {
    const plan = createPlan(VERSION);
    await assert.rejects(createVersionedModelInR2(plan.sourceKey, source), /fresh version UUID/);
    await assert.rejects(createVersionedModelInR2(plan.destinationKey, source), /PreconditionFailed/);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].IfNoneMatch, '*');
    assert.equal(requests[0].ContentType, plan.contentType);
    assert.equal(requests[0].CacheControl.replace(/\s/g, ''), plan.cacheControl);
    assert.equal(requests[0].ContentLength, source.length);
  } finally {
    S3Client.prototype.send = original;
  }
});
