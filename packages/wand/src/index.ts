import * as angles from "angles";

import * as Device from "./Device";

interface State {
  touching: boolean;
  color: {
    hue: number;
    saturation: number;
    luminosity: number;
  };
  deviceOrientation: {
    current?: Device.Orientation;
    onTouchStart?: Device.Orientation;
  };
}

const state: State = {
  touching: false,
  color: {
    hue: 50,
    saturation: 50,
    luminosity: 100
  },
  deviceOrientation: {}
};

const onTouchStart = () => {
  state.touching = true;
  state.deviceOrientation.onTouchStart = state.deviceOrientation.current;
};

const onTouchEnd = () => {
  state.touching = false;
  delete state.deviceOrientation.onTouchStart;
};

const onOrientation = ({ alpha, beta, gamma }: Device.Orientation) => {
  state.deviceOrientation.current = { alpha, beta, gamma };

  if (!state.deviceOrientation.onTouchStart) {
    return;
  }

  const dAlpha = state.deviceOrientation.onTouchStart.alpha - alpha;

  document.body.innerHTML = [
    alpha,
    beta,
    gamma,
    state.deviceOrientation.onTouchStart.alpha,
    state.deviceOrientation.onTouchStart.beta,
    state.deviceOrientation.onTouchStart.gamma,
    dAlpha
  ]
    .map(angle => angle.toFixed(2))
    .join("<br>");
};

window.addEventListener("touchstart", onTouchStart as any, true);
window.addEventListener("touchend", onTouchEnd as any, true);
window.addEventListener("deviceorientation", onOrientation as any, true);
