export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ModelFit {
  /** Uniform scale applied to the model. */
  scale: number;
  /** Translation applied after scaling, in garment-local units. */
  offset: Vec3;
}

/**
 * How to fit a real garment model (DECISIONS.md D-089) onto its hanger,
 * from the model's own bounding box measured in its own coordinates —
 * before it is attached anywhere in the scene, since a box measured after
 * mounting includes the rail position and would misplace it.
 *
 * Scales uniformly to fit within `maxWidth` × `maxHeight` (a model's
 * authored units — centimetres, metres, anything — don't matter), then
 * moves it so its top-center sits at (0, `topY`, 0), centered in depth:
 * the point where the hanger bar meets the garment.
 */
export function fitModelToHanger(
  min: Vec3,
  max: Vec3,
  maxWidth: number,
  maxHeight: number,
  topY: number,
): ModelFit {
  const width = max.x - min.x;
  const height = max.y - min.y;
  const scale = Math.min(maxWidth / (width || 1), maxHeight / (height || 1));
  return {
    scale,
    offset: {
      x: (-(min.x + max.x) / 2) * scale,
      y: topY - max.y * scale,
      z: (-(min.z + max.z) / 2) * scale,
    },
  };
}
