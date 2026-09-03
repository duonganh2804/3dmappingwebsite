import * as Cesium from 'cesium';

export type HeatmapProperty = 'elevation';
export interface HeatmapSettings { enabled: boolean; property: HeatmapProperty; min: number; max: number; }
const EPSILON = 0.01;
const MAX_BOUND_TILES = 2048;
const MAX_BOUND_DEPTH = 8;
const MIN_PREFERRED_SAMPLES = 8;

type RuntimeTileBoundingVolume = {
  boundingVolume?: {
    center?: Cesium.Cartesian3;
    halfAxes?: Cesium.Matrix3;
    radius?: number;
  };
  boundingSphere?: Cesium.BoundingSphere;
  minimumHeight?: number;
  maximumHeight?: number;
  rectangle?: Cesium.Rectangle;
};

type VerticalExtent = {
  low: number;
  high: number;
  type: 'obb' | 'region' | 'sphere';
  quality: 'content' | 'leaf' | 'tile' | 'root' | 'sphere';
  depth: number;
  coordinateSpace: 'project-up';
};

function quantile(sorted: number[], ratio: number): number {
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
}

function robustQuantile(values: number[], ratio: number): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length <= 2) return ratio < 0.5 ? sorted[0] : sorted[sorted.length - 1];
  if (sorted.length < MIN_PREFERRED_SAMPLES) {
    // Sparse sets cannot support IQR reliably. P10/P90 reduces the leverage of
    // one coarse interval without collapsing legitimate vertical extremes.
    return quantile(sorted, ratio < 0.5 ? 0.1 : 0.9);
  }
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  // A conservative 3×IQR fence removes gross culling-volume outliers while
  // retaining legitimate isolated high structures more readily than 1.5×IQR.
  const filtered = iqr > EPSILON
    ? sorted.filter(value => value >= q1 - 3 * iqr && value <= q3 + 3 * iqr)
    : sorted;
  return quantile(filtered.length > 0 ? filtered : sorted, ratio);
}

type RangeEstimate = { ground: number; top: number; span: number };

function estimateRange(samples: VerticalExtent[]): RangeEstimate | null {
  const ground = robustQuantile(samples.map(sample => sample.low), 0.05);
  const top = robustQuantile(samples.map(sample => sample.high), 0.98);
  const span = top - ground;
  return Number.isFinite(ground) && Number.isFinite(top) && span > EPSILON
    ? { ground, top, span }
    : null;
}

function rangeSanity(samples: VerticalExtent[], estimate: RangeEstimate) {
  const normalized = samples.map(sample =>
    (((sample.low + sample.high) * 0.5) - estimate.ground) / estimate.span
  ).filter(Number.isFinite).sort((a, b) => a - b);
  const above80Percent = normalized.filter(value => value > 0.8).length / Math.max(1, normalized.length);
  const below20Percent = normalized.filter(value => value < 0.2).length / Math.max(1, normalized.length);
  return {
    medianNormalizedCenter: normalized.length > 0 ? quantile(normalized, 0.5) : NaN,
    above80Percent,
    below20Percent,
    passed: above80Percent < 0.6 && below20Percent < 0.6,
  };
}

function mad(values: number[]): { median: number; scaledMad: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const deviations = sorted.map(value => Math.abs(value - median)).sort((a, b) => a - b);
  return { median, scaledMad: quantile(deviations, 0.5) * 1.4826 };
}

function cleanRangeOutliers(samples: VerticalExtent[]) {
  if (samples.length < 3) {
    return { samples, removedCoarseIntervals: 0, removedLowOutliers: 0, removedHighOutliers: 0 };
  }
  const widths = samples.map(sample => sample.high - sample.low);
  const lows = samples.map(sample => sample.low);
  const highs = samples.map(sample => sample.high);
  const widthStats = mad(widths);
  const lowStats = mad(lows);
  const highStats = mad(highs);
  const K = 3.5;
  let removedCoarseIntervals = 0;
  let removedLowOutliers = 0;
  let removedHighOutliers = 0;
  const filtered = samples.filter((sample, index) => {
    const coarse = widthStats.scaledMad > EPSILON
      ? widths[index] > widthStats.median + K * widthStats.scaledMad
      : widthStats.median > EPSILON && widths[index] > widthStats.median * 4;
    const lowOutlier = lowStats.scaledMad > EPSILON && Math.abs(lows[index] - lowStats.median) > K * lowStats.scaledMad;
    const highOutlier = highStats.scaledMad > EPSILON && Math.abs(highs[index] - highStats.median) > K * highStats.scaledMad;
    if (coarse) removedCoarseIntervals += 1;
    if (lowOutlier) removedLowOutliers += 1;
    if (highOutlier) removedHighOutliers += 1;
    return !coarse && !lowOutlier && !highOutlier;
  });
  const minimumRetained = Math.max(2, Math.ceil(samples.length / 2));
  return {
    samples: filtered.length >= minimumRetained ? filtered : samples,
    removedCoarseIntervals: filtered.length >= minimumRetained ? removedCoarseIntervals : 0,
    removedLowOutliers: filtered.length >= minimumRetained ? removedLowOutliers : 0,
    removedHighOutliers: filtered.length >= minimumRetained ? removedHighOutliers : 0,
  };
}

function selectCredibleUpperSamples(samples: VerticalExtent[]) {
  const widths = samples.map(sample => sample.high - sample.low);
  const widthStats = mad(widths);
  const K = 3.5;
  const rejectedReasons = { coarseInterval: 0, rootOrSphere: 0, shallowTile: 0 };
  const credible = samples.filter((sample, index) => {
    const coarseInterval = widthStats.scaledMad > EPSILON
      ? widths[index] > widthStats.median + K * widthStats.scaledMad
      : widthStats.median > EPSILON && widths[index] > widthStats.median * 4;
    const rootOrSphere = sample.quality === 'root' || sample.quality === 'sphere' || sample.type === 'sphere';
    const shallowTile = sample.quality === 'tile' && sample.depth < 2;
    if (coarseInterval) rejectedReasons.coarseInterval += 1;
    if (rootOrSphere) rejectedReasons.rootOrSphere += 1;
    if (shallowTile) rejectedReasons.shallowTile += 1;
    return !coarseInterval && !rootOrSphere && !shallowTile;
  });
  return { samples: credible, rejectedReasons };
}

function continuousColorConditions(value: string, min: number, max: number, alpha: number): Array<[string, string]> {
  const safeMax = max > min ? max : min + EPSILON;
  const span = safeMax - min;
  const color = (hex: string) => `color('${hex}', ${alpha.toFixed(3)})`;
  const normalized = `clamp(((${value})-${min.toFixed(6)})/${span.toFixed(6)}, 0.0, 1.0)`;
  const stops = [
    ['#0066ff', 0.0],
    ['#00e5ff', 0.2],
    ['#00d45a', 0.4],
    ['#ffe600', 0.6],
    ['#ff8c00', 0.8],
    ['#ff2b20', 1.0],
  ] as const;
  return stops.slice(0, -1).map(([hex, start], index) => {
    const [nextHex, end] = stops[index + 1];
    const local = `clamp((${normalized}-${start.toFixed(1)})/${(end - start).toFixed(1)}, 0.0, 1.0)`;
    const condition = index < stops.length - 2 ? `${normalized} < ${end.toFixed(1)}` : 'true';
    return [condition, `mix(${color(hex)}, ${color(nextHex)}, ${local})`];
  });
}

/** GPU point-cloud heatmap using one project-wide ENU Up axis and datum. */
export class HeatmapController {
  private originalStyles = new WeakMap<Cesium.Cesium3DTileset, Cesium.Cesium3DTileStyle | undefined>();
  private originalBlendModes = new WeakMap<Cesium.Cesium3DTileset, Cesium.Cesium3DTileColorBlendMode>();
  private originalBlendAmounts = new WeakMap<Cesium.Cesium3DTileset, number>();
  private heatmapStyles = new WeakMap<Cesium.Cesium3DTileset, Cesium.Cesium3DTileStyle>();
  private targets: Cesium.Cesium3DTileset[] = [];
  private settings: HeatmapSettings = { enabled: false, property: 'elevation', min: 0, max: 1 };
  private origin: Cesium.Cartesian3 | null = null;
  private up: Cesium.Cartesian3 | null = null;
  private datum = 0;
  private alpha = 1;
  private lastRange: { datum: number; span: number } | null = null;
  private projectKey: string | null = null;

  setProjectReference(origin: Cesium.Cartesian3, projectKey?: string) {
    this.origin = Cesium.Cartesian3.clone(origin);
    this.up = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(origin, new Cesium.Cartesian3());
    this.datum = 0;
    this.lastRange = null;
    this.projectKey = projectKey ?? null;
  }

  setTargets(targets: Cesium.Cesium3DTileset[]): boolean {
    const nextTargets = [...new Set(targets.filter(target => !target.isDestroyed()))];
    const nextTargetSet = new Set(nextTargets);
    for (const target of this.targets) {
      if (!nextTargetSet.has(target)) this.restoreTarget(target);
    }
    this.targets = nextTargets;
    if (this.settings.enabled) this.capture();
    return this.apply();
  }

  setBaseStyle(style: Cesium.Cesium3DTileStyle, alpha: number): boolean {
    this.alpha = Cesium.Math.clamp(alpha, 0, 1);
    for (const target of this.targets) {
      if (target.isDestroyed()) continue;
      if (this.settings.enabled) this.originalStyles.set(target, style);
      else target.style = style;
    }
    return this.apply();
  }

  update(settings: HeatmapSettings): boolean {
    const wasEnabled = this.settings.enabled;
    this.settings = settings;
    if (!wasEnabled && settings.enabled) this.capture();
    if (wasEnabled && !settings.enabled) {
      this.restore();
      return true;
    }
    return this.apply();
  }

  autoRange(force = false, viewer?: Cesium.Viewer | null): { min: number; max: number } | null {
    if (!this.origin || !this.up) return null;
    const allSamples: VerticalExtent[] = [];
    for (const target of this.targets) {
      if (target.isDestroyed()) continue;
      allSamples.push(...this.collectTilesetExtents(target));
    }

    const valid = allSamples.filter(sample =>
      Number.isFinite(sample.low) && Number.isFinite(sample.high) && sample.high >= sample.low
    );
    const contentOrLeafObb = valid.filter(sample =>
      sample.type === 'obb' &&
      ((sample.quality === 'content' && sample.depth > 0) || sample.quality === 'leaf')
    );
    const deeperObb = valid.filter(sample => sample.type === 'obb' && sample.quality === 'tile');
    const detailedRegion = valid.filter(sample => sample.type === 'region' && sample.quality !== 'root');
    const rootGeometric = valid.filter(sample => sample.type !== 'sphere' && sample.depth === 0);
    // Quality wins over sample count: a small set of content/leaf world OBBs is
    // never diluted with a coarse root merely to cross a percentile threshold.
    const selected = contentOrLeafObb.length > 0
      ? contentOrLeafObb
      : deeperObb.length > 0
        ? deeperObb
        : detailedRegion.length > 0
          ? detailedRegion
          : rootGeometric.length > 0
            ? rootGeometric
            : valid.filter(sample => sample.type === 'sphere');
    if (selected.length === 0) return null;

    const primary = estimateRange(selected);
    if (!primary) return null;
    const primarySanity = rangeSanity(selected, primary);
    const cleanup = cleanRangeOutliers(selected);
    const hasOutliers = cleanup.removedCoarseIntervals > 0 ||
      cleanup.removedLowOutliers > 0 || cleanup.removedHighOutliers > 0;
    const fallbackEstimate = hasOutliers ? estimateRange(cleanup.samples) : null;
    const fallbackSanity = fallbackEstimate ? rangeSanity(cleanup.samples, fallbackEstimate) : null;
    // Lower and upper bounds have different failure modes. Keep the existing
    // robust cleanup for ground, but never reject a detailed upper bound merely
    // because its high value is far above the majority (a tower/stack is sparse).
    const useGroundFallback = Boolean(fallbackEstimate && (
      cleanup.removedCoarseIntervals > 0 || cleanup.removedLowOutliers > 0 || !primarySanity.passed
    ));
    const ground = useGroundFallback ? fallbackEstimate!.ground : primary.ground;
    const upperCandidatePool = valid.filter(sample =>
      sample.type !== 'sphere'
      && sample.quality !== 'root'
      && (sample.quality !== 'tile' || sample.depth >= 2)
    );
    const upperSelection = selectCredibleUpperSamples(upperCandidatePool.length > 0 ? upperCandidatePool : selected);
    const credibleHighs = upperSelection.samples.map(sample => sample.high).sort((a, b) => a - b);
    const credibleMax = credibleHighs.length > 0 ? credibleHighs[credibleHighs.length - 1] : NaN;
    const upperEnvelopeExtended = Number.isFinite(credibleMax) && credibleMax > primary.top + EPSILON;
    let top = Math.max(primary.top, Number.isFinite(credibleMax) ? credibleMax : primary.top);
    if (upperEnvelopeExtended) top += (top - ground) * 0.03;

    const visibleBefore = this.sampleVisibleHeights(viewer, ground, top - ground);
    if (
      visibleBefore.count >= 8
      && visibleBefore.saturationAbove95Percent >= 0.15
      && Number.isFinite(visibleBefore.p98)
      && ground + visibleBefore.p98 > top
    ) {
      top = ground + visibleBefore.p98 * 1.03;
    }
    const span = top - ground;
    const finalEstimate = { ground, top, span };
    const finalSanity = rangeSanity(selected, finalEstimate);
    const visibleAfter = this.summarizeVisibleHeights(visibleBefore.values, span);
    if (useGroundFallback && fallbackSanity && fallbackSanity.above80Percent >= 0.8 && !upperEnvelopeExtended) {
      console.error('[Heatmap] Elevation bounds remain top-skewed after robust fallback; original RGB retained.');
      return null;
    }

    const datumTolerance = Math.max(0.25, span * 0.0025);
    const spanTolerance = Math.max(0.5, span * 0.005);
    const materiallyChanged = !this.lastRange ||
      Math.abs(ground - this.lastRange.datum) > datumTolerance ||
      Math.abs(span - this.lastRange.span) > spanTolerance;
    if (!force && !materiallyChanged && this.lastRange) {
      return { min: 0, max: this.lastRange.span };
    }

    this.datum = ground;
    this.lastRange = { datum: ground, span };
    this.apply();
    if (import.meta.env.DEV) {
      const count = (quality: VerticalExtent['quality']) => valid.filter(sample => sample.quality === quality).length;
      console.info('[HeatmapRange]', {
        project: this.projectKey,
        tilesetCount: this.targets.length,
        contentBoundsCount: count('content'),
        leafBoundsCount: count('leaf'),
        tileBoundsCount: count('tile'),
        rootBoundsCount: count('root'),
        sphereFallbackCount: selected.filter(sample => sample.type === 'sphere').length,
        selectedBoundsCount: selected.length,
        selectedDistribution: this.summarizeExtents(selected),
        selectedSourceTypes: [...new Set(selected.map(sample => `${sample.quality}:${sample.type}`))],
        selectedDepthRange: selected.length > 0
          ? [Math.min(...selected.map(sample => sample.depth)), Math.max(...selected.map(sample => sample.depth))]
          : null,
        primary: { ...primary, sanity: primarySanity },
        fallback: {
          usedForGround: useGroundFallback,
          removedCoarseIntervals: cleanup.removedCoarseIntervals,
          removedLowOutliers: cleanup.removedLowOutliers,
          removedHighOutliers: cleanup.removedHighOutliers,
          estimate: fallbackEstimate,
          sanity: fallbackSanity,
          method: '3.5× scaled MAD on interval height, low tail, and high tail',
        },
        groundMethod: selected.length >= MIN_PREFERRED_SAMPLES
          ? 'P05 after conservative 3xIQR fence'
          : selected.length > 2 ? 'sparse P10' : 'sparse minimum',
        topMethod: selected.length >= MIN_PREFERRED_SAMPLES
          ? 'max(P98 robust, credible detailed upper envelope)'
          : selected.length > 2 ? 'max(sparse P90, credible detailed upper envelope)' : 'sparse maximum',
        topDiagnostics: {
          selectedHighCount: upperCandidatePool.length > 0 ? upperCandidatePool.length : selected.length,
          credibleHighCount: credibleHighs.length,
          ...this.summarizeValues(selected.map(sample => sample.high)),
          credibleMax,
          rejectedUpperCandidates: (upperCandidatePool.length > 0 ? upperCandidatePool.length : selected.length) - credibleHighs.length,
          rejectedReasons: upperSelection.rejectedReasons,
          visibleSampleCount: visibleAfter.count,
          visibleSampleP90: visibleAfter.p90,
          visibleSampleP98: visibleAfter.p98,
          visibleSampleMax: visibleAfter.max,
          saturationAbove95PercentBefore: visibleBefore.saturationAbove95Percent,
          saturationAbove95Percent: visibleAfter.saturationAbove95Percent,
          finalTop: top,
          finalSpan: span,
        },
        groundDatum: ground,
        topEstimate: top,
        verticalSpan: span,
        step: span / 6,
        estimatorPass: finalSanity.passed,
      });
    }
    return { min: 0, max: span };
  }

  private collectTilesetExtents(target: Cesium.Cesium3DTileset): VerticalExtent[] {
    const queue = [{ tile: target.root, depth: 0 }];
    const samples: VerticalExtent[] = [];
    let visited = 0;
    while (queue.length > 0 && visited < MAX_BOUND_TILES) {
      const entry = queue.shift();
      if (!entry) break;
      visited += 1;

      const runtimeTile = entry.tile as unknown as {
        boundingVolume: RuntimeTileBoundingVolume;
        contentBoundingVolume?: RuntimeTileBoundingVolume;
      };
      // The public runtime getter falls back to tile.boundingVolume. Identity
      // distinguishes an explicitly tighter content volume without private fields.
      if (runtimeTile.contentBoundingVolume && runtimeTile.contentBoundingVolume !== runtimeTile.boundingVolume) {
        const content = this.projectBound(runtimeTile.contentBoundingVolume, 'content', entry.depth);
        if (content) samples.push(content);
      }

      const quality: VerticalExtent['quality'] = entry.depth === 0
        ? 'root'
        : entry.tile.children.length === 0
          ? 'leaf'
          : 'tile';
      const extent = this.projectBound(runtimeTile.boundingVolume, quality, entry.depth);
      if (extent) samples.push(extent);

      if (entry.depth < MAX_BOUND_DEPTH) {
        for (const child of entry.tile.children) queue.push({ tile: child, depth: entry.depth + 1 });
      }
    }
    return samples;
  }

  private projectBound(
    wrapper: RuntimeTileBoundingVolume,
    quality: VerticalExtent['quality'],
    depth: number,
  ): VerticalExtent | null {
    if (!this.origin || !this.up) return null;
    const volume = wrapper.boundingVolume;

    // TileBoundingRegion also owns an internally derived OBB. Detect its
    // authoritative ellipsoid heights before treating the wrapper as a box.
    if (
      wrapper.rectangle &&
      Number.isFinite(wrapper.minimumHeight) &&
      Number.isFinite(wrapper.maximumHeight)
    ) {
      const rectangle = wrapper.rectangle;
      const center = Cesium.Rectangle.center(rectangle, new Cesium.Cartographic());
      const horizontalSamples = [
        [rectangle.west, rectangle.south],
        [rectangle.west, rectangle.north],
        [rectangle.east, rectangle.south],
        [rectangle.east, rectangle.north],
        [center.longitude, center.latitude],
      ];
      const projected: number[] = [];
      for (const height of [wrapper.minimumHeight!, wrapper.maximumHeight!]) {
        for (const [longitude, latitude] of horizontalSamples) {
          const position = Cesium.Cartesian3.fromRadians(longitude, latitude, height);
          const upValue = this.toProjectUp(position);
          if (Number.isFinite(upValue)) projected.push(upValue);
        }
      }
      if (projected.length > 0) {
        return {
          low: Math.min(...projected),
          high: Math.max(...projected),
          type: 'region', quality, depth, coordinateSpace: 'project-up',
        };
      }
      return null;
    }

    if (volume?.center && volume.halfAxes) {
      const centerUp = this.toProjectUp(volume.center);
      let halfExtentUp = 0;
      for (let column = 0; column < 3; column += 1) {
        const axis = Cesium.Matrix3.getColumn(volume.halfAxes, column, new Cesium.Cartesian3());
        halfExtentUp += Math.abs(Cesium.Cartesian3.dot(axis, this.up));
      }
      if ([centerUp, halfExtentUp].every(Number.isFinite)) {
        return {
          low: centerUp - halfExtentUp,
          high: centerUp + halfExtentUp,
          type: 'obb', quality, depth, coordinateSpace: 'project-up',
        };
      }
    }

    const sphere = wrapper.boundingSphere;
    if (!sphere || !Number.isFinite(sphere.radius)) return null;
    const centerUp = this.toProjectUp(sphere.center);
    if (!Number.isFinite(centerUp)) return null;
    return {
      low: centerUp - sphere.radius,
      high: centerUp + sphere.radius,
      type: 'sphere', quality: 'sphere', depth, coordinateSpace: 'project-up',
    };
  }

  private toProjectUp(position: Cesium.Cartesian3): number {
    if (!this.origin || !this.up) return NaN;
    const offset = Cesium.Cartesian3.subtract(position, this.origin, new Cesium.Cartesian3());
    return Cesium.Cartesian3.dot(offset, this.up);
  }

  private sampleVisibleHeights(viewer: Cesium.Viewer | null | undefined, ground: number, span: number) {
    const empty = { count: 0, p90: NaN, p98: NaN, max: NaN, saturationAbove95Percent: NaN, values: [] as number[] };
    if (!viewer || viewer.isDestroyed() || !viewer.scene.pickPositionSupported || span <= EPSILON) return empty;
    const scene = viewer.scene;
    const width = Math.max(1, scene.canvas.clientWidth);
    const height = Math.max(1, scene.canvas.clientHeight);
    const heights: number[] = [];
    for (let row = 1; row <= 7; row++) {
      for (let column = 1; column <= 7; column++) {
        try {
          const point = scene.pickPosition(new Cesium.Cartesian2(width * column / 8, height * row / 8));
          if (!Cesium.defined(point)) continue;
          const relativeHeight = this.toProjectUp(point) - ground;
          if (Number.isFinite(relativeHeight)) heights.push(relativeHeight);
        } catch { /* depth buffer may not be ready during initial range estimation */ }
      }
    }
    heights.sort((a, b) => a - b);
    if (heights.length === 0) return empty;
    return this.summarizeVisibleHeights(heights, span);
  }

  private summarizeVisibleHeights(sortedHeights: number[], span: number) {
    if (sortedHeights.length === 0 || span <= EPSILON) {
      return { count: 0, p90: NaN, p98: NaN, max: NaN, saturationAbove95Percent: NaN, values: sortedHeights };
    }
    return {
      count: sortedHeights.length,
      p90: quantile(sortedHeights, 0.9),
      p98: quantile(sortedHeights, 0.98),
      max: sortedHeights[sortedHeights.length - 1],
      saturationAbove95Percent: sortedHeights.filter(value => value / span >= 0.95).length / sortedHeights.length,
      values: sortedHeights,
    };
  }

  private summarizeValues(values: number[]) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (sorted.length === 0) {
      return { highMin: NaN, highP50: NaN, highP75: NaN, highP90: NaN, highP95: NaN, highP98: NaN, highMax: NaN };
    }
    return {
      highMin: sorted[0],
      highP50: quantile(sorted, 0.5),
      highP75: quantile(sorted, 0.75),
      highP90: quantile(sorted, 0.9),
      highP95: quantile(sorted, 0.95),
      highP98: quantile(sorted, 0.98),
      highMax: sorted[sorted.length - 1],
    };
  }

  private summarizeExtents(samples: VerticalExtent[]) {
    const summarize = (values: number[]) => {
      const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
      if (sorted.length === 0) return null;
      return {
        min: sorted[0],
        p05: quantile(sorted, 0.05),
        p10: quantile(sorted, 0.1),
        median: quantile(sorted, 0.5),
        p75: quantile(sorted, 0.75),
        p90: quantile(sorted, 0.9),
        p95: quantile(sorted, 0.95),
        p98: quantile(sorted, 0.98),
        max: sorted[sorted.length - 1],
      };
    };
    return Object.fromEntries(['obb', 'region', 'sphere'].map(type => {
      const group = samples.filter(sample => sample.type === type);
      return [type, {
        count: group.length,
        lows: summarize(group.map(sample => sample.low)),
        highs: summarize(group.map(sample => sample.high)),
        coordinateSpace: 'project-up',
      }];
    }));
  }

  reset() {
    this.restore();
    // React may preserve the user's ON intent across a project switch, but the
    // controller must not apply the previous project's range to new targets.
    this.settings = { ...this.settings, enabled: false };
    this.targets = [];
    this.originalStyles = new WeakMap();
    this.originalBlendModes = new WeakMap();
    this.originalBlendAmounts = new WeakMap();
    this.heatmapStyles = new WeakMap();
    this.origin = null;
    this.up = null;
    this.datum = 0;
    this.lastRange = null;
    this.projectKey = null;
  }

  private capture() {
    for (const target of this.targets) {
      if (target.isDestroyed() || this.originalStyles.has(target)) continue;
      this.originalStyles.set(target, target.style);
      this.originalBlendModes.set(target, target.colorBlendMode);
      this.originalBlendAmounts.set(target, target.colorBlendAmount);
    }
  }

  private apply(): boolean {
    if (!this.settings.enabled) return true;
    if (!this.origin || !this.up) return this.fail('[Heatmap] Project elevation reference is unavailable.');
    const o = this.origin;
    const u = this.up;
    const constants = [o.x, o.y, o.z, u.x, u.y, u.z, this.datum, this.settings.min, this.settings.max, this.alpha];
    if (!constants.every(Number.isFinite)) return this.fail('[Heatmap] Refused invalid elevation constants.');

    const scalar = (value: number, digits: number) => value.toFixed(digits);
    // Scalar-only expression avoids GLSL-like vector constructors/functions. Cesium
    // 1.143 maps bracket access to the supported POSITION_ABSOLUTE components.
    const value = `(\${POSITION_ABSOLUTE}[0]-${scalar(o.x, 6)})*${scalar(u.x, 12)}+` +
      `(\${POSITION_ABSOLUTE}[1]-${scalar(o.y, 6)})*${scalar(u.y, 12)}+` +
      `(\${POSITION_ABSOLUTE}[2]-${scalar(o.z, 6)})*${scalar(u.z, 12)}-${scalar(this.datum, 6)}`;

    try {
      const conditions = continuousColorConditions(value, this.settings.min, this.settings.max, this.alpha);
      conditions.forEach((condition, index) => {
        if (typeof condition[0] !== 'string' || typeof condition[1] !== 'string') {
          throw new Error(`[Heatmap] Invalid color condition at index ${index}.`);
        }
      });

      // Cesium3DTileStyle getters return StyleExpression instances. They are not
      // valid constructor JSON and must never be copied into a new style spec.
      for (const target of this.targets) {
        if (target.isDestroyed()) continue;
        const baseSpec = this.originalStyles.get(target)?.style as { pointSize?: unknown; show?: unknown } | undefined;
        const styleOptions: Record<string, unknown> = { color: { conditions } };
        if (typeof baseSpec?.pointSize === 'number' || typeof baseSpec?.pointSize === 'string') {
          styleOptions.pointSize = baseSpec.pointSize;
        }
        if (typeof baseSpec?.show === 'boolean' || typeof baseSpec?.show === 'string') {
          styleOptions.show = baseSpec.show;
        }
        const style = new Cesium.Cesium3DTileStyle(styleOptions);
        // Mutate blend state only after the style parsed successfully.
        target.style = style;
        target.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.REPLACE;
        target.colorBlendAmount = 1;
        target.makeStyleDirty();
        this.heatmapStyles.set(target, style);
      }
      return true;
    } catch (error) {
      return this.fail('[Heatmap] Style creation failed; original rendering restored.', error);
    }
  }

  private fail(message: string, error?: unknown): false {
    console.error(message, error ?? '');
    this.restore();
    this.settings = { ...this.settings, enabled: false };
    return false;
  }

  private restore() {
    for (const target of this.targets) {
      this.restoreTarget(target);
    }
  }

  /** Reassert ownership after React/Cesium's current turn and redraw on demand. */
  ensureApplied(): number {
    if (!this.settings.enabled) return 0;
    let repaired = 0;
    for (const target of this.targets) {
      if (target.isDestroyed()) continue;
      const style = this.heatmapStyles.get(target);
      if (!style) continue;
      if (target.style !== style) {
        target.style = style;
        repaired += 1;
      }
      target.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.REPLACE;
      target.colorBlendAmount = 1;
      target.makeStyleDirty();
    }
    return repaired;
  }

  private restoreTarget(target: Cesium.Cesium3DTileset) {
    if (target.isDestroyed() || !this.originalStyles.has(target)) return;
    target.style = this.originalStyles.get(target);
    const mode = this.originalBlendModes.get(target);
    const amount = this.originalBlendAmounts.get(target);
    if (mode !== undefined) target.colorBlendMode = mode;
    if (amount !== undefined) target.colorBlendAmount = amount;
    target.makeStyleDirty();
    this.originalStyles.delete(target);
    this.originalBlendModes.delete(target);
    this.originalBlendAmounts.delete(target);
    this.heatmapStyles.delete(target);
  }
}
