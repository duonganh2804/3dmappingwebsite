import assert from 'node:assert/strict';
import test from 'node:test';
import { DynamicEnvironmentMapManager, type Scene } from 'cesium';
import { installTranslucentPickComputeGuard } from '../src/components/Map/viewer/translucentPickComputeGuard.ts';

const fixture = () => {
  const passes = { pick: false, depth: false };
  const calls: object[] = [];
  const engine = { execute(command: object) { calls.push(command); } };
  const scene = { _computeEngine: engine, frameState: { passes } };
  const uninstall = installTranslucentPickComputeGuard(scene as unknown as Scene);
  return { passes, calls, engine, uninstall };
};

test('depth picking does not replay a completed environment texture command', () => {
  const { passes, calls, engine } = fixture();
  const command = { owner: new DynamicEnvironmentMapManager() };
  engine.execute(command);
  Object.assign(passes, { pick: true, depth: true });
  engine.execute(command);
  engine.execute(command);
  assert.deepEqual(calls, [command]);

  const pending = { owner: command.owner };
  engine.execute(pending);
  engine.execute(pending);
  assert.deepEqual(calls, [command, pending]);
});

test('ordinary rendering, other compute owners and non-depth picks are preserved', () => {
  const { passes, calls, engine } = fixture();
  const command = { owner: new DynamicEnvironmentMapManager() };
  engine.execute(command);
  engine.execute(command);
  passes.pick = true;
  engine.execute(command);
  passes.depth = true;
  const imageryCommand = { owner: {} };
  engine.execute(imageryCommand);
  engine.execute(imageryCommand);
  assert.deepEqual(calls, [command, command, command, imageryCommand, imageryCommand]);
});

test('a failed command is retried and its error is never swallowed', () => {
  const failure = new Error('compute failure');
  let attempts = 0;
  const engine = { execute() { attempts++; throw failure; } };
  const scene = { _computeEngine: engine, frameState: { passes: { pick: true, depth: true } } };
  installTranslucentPickComputeGuard(scene as unknown as Scene);
  const command = { owner: new DynamicEnvironmentMapManager() };
  const execute = engine.execute as (command: object) => void;
  assert.throws(() => execute(command), error => error === failure);
  assert.throws(() => execute(command), error => error === failure);
  assert.equal(attempts, 2);
});

test('uninstall restores execution without overwriting another wrapper', () => {
  const { passes, calls, engine, uninstall } = fixture();
  const command = { owner: new DynamicEnvironmentMapManager() };
  engine.execute(command);
  Object.assign(passes, { pick: true, depth: true });
  uninstall();
  engine.execute(command);
  assert.equal(calls.length, 2);
  const otherWrapper = () => undefined;
  engine.execute = otherWrapper;
  uninstall();
  assert.equal(engine.execute, otherWrapper);
});
