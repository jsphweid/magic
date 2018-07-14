import _ from "lodash";
import hsl from "hsl-to-hex";

import * as Lights from "~/Lights";
import lights from "../data/lights.json";

interface Light {
  id: string;
  name: string;
  angle: number;
}

interface BoundedLight {
  id: string;
  start: number;
  end: number;
}

const bounds = lights.reduce<BoundedLight[]>((acc, { id, angle }, index) => {
  const previous = (index !== 0
    ? (lights[index - 1] as Light)
    : _.last(lights)) as Light;

  const next = index >= lights.length - 1 ? lights[0] : lights[index + 1];

  const previousAngle =
    previous.angle < angle ? previous.angle : previous.angle - 360;

  const nextAngle = next.angle > angle ? next.angle : next.angle - 360;

  return [
    ...acc,
    {
      id,
      start: previousAngle + (angle - previousAngle) / 2,
      end: angle + (nextAngle - angle) / 2
    }
  ];
}, []);

const lightIdForAngle = (angle: number): string =>
  bounds.reduce<string | null>(
    (acc, { id, start, end }) => (start < angle && angle < end ? id : acc),
    null
  ) || (_.last(lights) as Light).id;

let pressing = false;
let lastRequestTime = 0;

let hue = 0;
let luminosity = 0;

const onTouchStart = () => (pressing = true);
const onTouchEnd = () => (pressing = false);

const onOrientation = async ({
  alpha,
  beta,
  gamma
}: {
  alpha: number;
  beta: number;
  gamma: number;
}) => {
  if (pressing) {
    hue = gamma * 4;
    luminosity = _.clamp(50 + 400 * ((beta - 35) / 180), 0, 100);

    document.body.style.backgroundColor = `
      hsl(${hue}, 100%, ${luminosity}%)
    `;
  }

  const now = new Date().getTime();
  const msSinceLastRequest = now - lastRequestTime;

  if (msSinceLastRequest < 300) {
    return;
  }

  lastRequestTime = now;

  await Lights.set(lightIdForAngle(360 - alpha), {
    color: hsl(hue, 100, luminosity)
  });
};

// const onMotion = async ({
//   acceleration: { x, y, z }
// }: {
//   acceleration: { x: number; y: number; z: number };
// }) => {};

window.addEventListener("touchstart", onTouchStart as any, true);
window.addEventListener("touchend", onTouchEnd as any, true);
window.addEventListener("deviceorientation", onOrientation as any, true);
// window.addEventListener("devicemotion", onMotion as any, true);
