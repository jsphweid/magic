import hsl from "hsl-to-hex";
import _ from "lodash";

import * as Device from "./Device";

export interface HSL {
  hue: number;
  saturation: number;
  luminosity: number;
}

export const toHex = ({ hue, saturation, luminosity }: HSL): string =>
  hsl(hue, saturation, luminosity);

const speed = 1.5;

export const withOrientationShift = (
  { hue, saturation, luminosity }: HSL,
  { dAlpha, dBeta, dGamma }: Device.OrientationDeltas
): HSL => ({
  hue: hue + dGamma * speed,
  saturation: _.clamp(saturation + dAlpha * speed * 0.25, 0, 100),
  luminosity: _.clamp(luminosity - dBeta * speed, 0, 100)
});
