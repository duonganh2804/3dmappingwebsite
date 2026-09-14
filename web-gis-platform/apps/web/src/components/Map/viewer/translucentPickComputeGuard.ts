import { DynamicEnvironmentMapManager, type Scene } from 'cesium';

type EnvironmentCommand = { owner?: unknown };
type ComputeEngine = { execute: (command: EnvironmentCommand) => void };
type ComputeScene = {
  _computeEngine: ComputeEngine;
  frameState: { passes: { pick: boolean; depth: boolean } };
};

/**
 * Cesium 1.143 and 1.145 retain frameState.commandList during translucent depth
 * picking. This can replay an environment-map command whose postExecute already
 * destroyed its output texture (DynamicEnvironmentMapManager radiance/specular
 * maps). Only suppress that replay in the depth-picking pass; new commands and
 * normal rendering still go through Cesium's original compute engine.
 */
export const installTranslucentPickComputeGuard = (scene: Scene) => {
  // These internals are isolated here so a future Cesium upgrade can recheck them.
  const computeScene = scene as unknown as ComputeScene;
  const engine = computeScene._computeEngine;
  const originalExecute = engine?.execute;
  if (!originalExecute || !computeScene.frameState?.passes) return () => undefined;

  const completed = new WeakSet<EnvironmentCommand>();
  const execute = function (this: ComputeEngine, command: EnvironmentCommand) {
    const environmentCommand = command.owner instanceof DynamicEnvironmentMapManager;
    const { pick, depth } = computeScene.frameState.passes;
    if (environmentCommand && pick && depth && completed.has(command)) return;

    originalExecute.call(this, command);
    if (environmentCommand) completed.add(command);
  };

  engine.execute = execute;
  return () => {
    if (engine.execute === execute) engine.execute = originalExecute;
  };
};
