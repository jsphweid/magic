import * as D3 from "d3";

export const enum Name {
  POSITIVE_HIGH = "POSITIVE_HIGH",
  POSITIVE_MEDIUM = "POSITIVE_MEDIUM",
  POSITIVE_LOW = "POSITIVE_LOW",
  NEUTRAL = "NEUTRAL",
  NEGATIVE_LOW = "NEGATIVE_LOW",
  NEGATIVE_MEDIUM = "NEGATIVE_MEDIUM",
  NEGATIVE_HIGH = "NEGATIVE_HIGH"
}

export const nameFromString = (name: string): Name => {
  switch (name) {
    case Name.POSITIVE_HIGH:
      return Name.POSITIVE_HIGH;
    case Name.POSITIVE_MEDIUM:
      return Name.POSITIVE_MEDIUM;
    case Name.POSITIVE_LOW:
      return Name.POSITIVE_LOW;
    case Name.NEGATIVE_LOW:
      return Name.NEGATIVE_LOW;
    case Name.NEGATIVE_MEDIUM:
      return Name.NEGATIVE_MEDIUM;
    case Name.NEGATIVE_HIGH:
      return Name.NEGATIVE_HIGH;
    default:
      return Name.NEUTRAL;
  }
};

export interface Values {
  [Name.POSITIVE_HIGH]: number;
  [Name.POSITIVE_MEDIUM]: number;
  [Name.POSITIVE_LOW]: number;
  [Name.NEUTRAL]: number;
  [Name.NEGATIVE_LOW]: number;
  [Name.NEGATIVE_MEDIUM]: number;
  [Name.NEGATIVE_HIGH]: number;
}

export const values: Values = {
  [Name.POSITIVE_HIGH]: 3,
  [Name.POSITIVE_MEDIUM]: 2,
  [Name.POSITIVE_LOW]: 1,
  [Name.NEUTRAL]: 0,
  [Name.NEGATIVE_LOW]: -1,
  [Name.NEGATIVE_MEDIUM]: -2,
  [Name.NEGATIVE_HIGH]: -3
};

export const valuesZero: Values = {
  [Name.POSITIVE_HIGH]: 0,
  [Name.POSITIVE_MEDIUM]: 0,
  [Name.POSITIVE_LOW]: 0,
  [Name.NEUTRAL]: 0,
  [Name.NEGATIVE_LOW]: 0,
  [Name.NEGATIVE_MEDIUM]: 0,
  [Name.NEGATIVE_HIGH]: 0
};

export const names = Object.keys(values);

export const valueOf = (score: Name | string): number =>
  values[nameFromString(score)] || 0;

export const absoluteValueOf = (score: Name | string): number =>
  Math.abs(valueOf(score));

export const colorForName = (score: Name | string): string =>
  colorInterpolation(colorStops[nameFromString(score)]) as any;

export const colorForIndex = (index: number): string =>
  colorForName(names[index]);

export const colors = [
  "hsl(355, 97%, 62%)",
  "hsl(65, 100%, 51%)",
  "hsl(190, 97%, 62%)"
];

const colorStops: Values = {
  [Name.POSITIVE_HIGH]: 1,
  [Name.POSITIVE_MEDIUM]: 0.85,
  [Name.POSITIVE_LOW]: 0.7,
  [Name.NEUTRAL]: 0.5,
  [Name.NEGATIVE_LOW]: 0.3,
  [Name.NEGATIVE_MEDIUM]: 0.15,
  [Name.NEGATIVE_HIGH]: 0
};

const colorInterpolation = D3.scaleLinear()
  .domain([0, 0.5, 1])
  .range(colors.map(color => D3.color(color) || "#000") as any)
  .interpolate(D3.interpolateHcl as any);

// const colorInterpolation = D3.interpolateHslLong(
//   D3.color(colors.min) || "#000",
//   D3.color(colors.max) || "#fff"
// );
