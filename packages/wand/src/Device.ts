import * as angles from "angles";

export interface Orientation {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface OrientationDeltas {
  dAlpha: number;
  dBeta: number;
  dGamma: number;
}

export const orientationDeltas = (
  from: Orientation,
  to: Orientation
): OrientationDeltas => ({
  dAlpha: angleDifference(from.alpha, to.alpha),
  dBeta: angleDifference(from.beta, to.beta),
  dGamma: angleDifference(from.gamma, to.gamma)
});

const angleDifference = (a: number, b: number): number =>
  angles.distance(a, b) * angles.shortestDirection(a, b);
