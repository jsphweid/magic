// import _ from "lodash";

// import * as Lights from "~/Lights";
// import lights from "../data/lights.json";

// export interface BoundedLight extends Lights.Light {
//   angle: number;
//   bounds: {
//     start: number;
//     end: number;
//   };
// }

// const boundedLights = lights.reduce<BoundedLight[]>((acc, light, index) => {
//   const previous = (index !== 0
//     ? (lights[index - 1] as BoundedLight)
//     : _.last(lights)) as BoundedLight;

//   const next = index >= lights.length - 1 ? lights[0] : lights[index + 1];

//   const previousAngle =
//     previous.angle < light.angle ? previous.angle : previous.angle - 360;

//   const nextAngle = next.angle > light.angle ? next.angle : next.angle - 360;

//   return [
//     ...acc,
//     {
//       ...light,
//       bounds: {
//         start: previousAngle + (light.angle - previousAngle) / 2,
//         end: light.angle + (nextAngle - light.angle) / 2
//       }
//     }
//   ];
// }, []);

// export const lightFromAngle = (angle: number): BoundedLight =>
//   boundedLights.reduce<BoundedLight | null>(
//     (acc, light) =>
//       light.bounds.start < angle && angle < light.bounds.end ? light : acc,
//     null
//   ) || (_.last(boundedLights) as BoundedLight);
