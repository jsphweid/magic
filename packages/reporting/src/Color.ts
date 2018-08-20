import * as D3 from "d3";

import * as Time from "~/time";

export const forScoreNameIndex = (index: number): string =>
  forScoreName(Time.Score.names[index]);

export const forScoreName = (score: Time.Score.Name | string): string =>
  colorInterpolation(colorStops[Time.Score.nameFromString(score)]) as any;

const colors = [
  "hsl(350, 97%, 62%)",
  "hsl(65, 100%, 51%)",
  "hsl(150, 97%, 62%)"
];

const colorStops: Time.Score.Values = {
  [Time.Score.Name.POSITIVE_HIGH]: 1,
  [Time.Score.Name.POSITIVE_MEDIUM]: 0.9,
  [Time.Score.Name.POSITIVE_LOW]: 0.8,
  [Time.Score.Name.NEUTRAL]: 0.5,
  [Time.Score.Name.NEGATIVE_LOW]: 0.08,
  [Time.Score.Name.NEGATIVE_MEDIUM]: 0.04,
  [Time.Score.Name.NEGATIVE_HIGH]: 0
};

const colorInterpolation = D3.scaleLinear<D3.ColorCommonInstance>()
  .domain([0, 0.5, 1])
  .range(
    colors.reduce<D3.ColorCommonInstance[]>((acc, colorHSL) => {
      const color = D3.color(colorHSL);
      return color ? [...acc, color.rgb()] : acc;
    }, [])
  )
  .interpolate(D3.interpolateHcl);
