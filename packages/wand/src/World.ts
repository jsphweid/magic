// import _ from "lodash";
// import hsl from "hsl-to-hex";

// import * as Lights from "~/Lights";
// import lights from "../data/lights.json";

// interface Light extends Lights.Light {
//   angle: number;
//   bounds: { start: number; end: number };
// }

// interface BoundedLight {
//   id: string;
//   start: number;
//   end: number;
// }

// const bounds = lights.reduce<BoundedLight[]>((acc, { id, angle }, index) => {
//   const previous = (index !== 0
//     ? (lights[index - 1] as Light)
//     : _.last(lights)) as Light;

//   const next = index >= lights.length - 1 ? lights[0] : lights[index + 1];

//   const previousAngle =
//     previous.angle < angle ? previous.angle : previous.angle - 360;

//   const nextAngle = next.angle > angle ? next.angle : next.angle - 360;

//   return [
//     ...acc,
//     {
//       id,
//       start: previousAngle + (angle - previousAngle) / 2,
//       end: angle + (nextAngle - angle) / 2
//     }
//   ];
// }, []);

// // const lightIdForAngle = (angle: number): string =>
// //   bounds.reduce<string | null>(
// //     (acc, { id, start, end }) => (start < angle && angle < end ? id : acc),
// //     null
// //   ) || (_.last(lights) as Light).id;

// // if (pressing) {
// //   hue = gamma * 4;
// //   luminosity = _.clamp(50 + 1000 * ((beta - 20) / 180), 0, 100);

// //   document.body.style.backgroundColor = `
// //     hsl(${hue}, 100%, ${luminosity}%)
// //   `;
// // }
