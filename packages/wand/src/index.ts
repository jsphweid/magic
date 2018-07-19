import * as Lights from "~/Lights";

import * as World from "./World";
import * as Device from "./Device";
import * as Color from "./Color";

interface State {
  light?: World.BoundedLight;
  color: {
    current: Color.HSL;
    onDeviceOrientation?: Color.HSL;
  };
  deviceOrientation: {
    current: Device.Orientation;
    onTouchStart?: Device.Orientation;
  };
  timeSince: {
    touchStart: Date;
    lastRequest: Date;
  };
}

const state: State = {
  color: {
    current: {
      hue: 0,
      saturation: 100,
      luminosity: 0
    }
  },
  deviceOrientation: {
    current: {
      alpha: 0,
      beta: 0,
      gamma: 0
    }
  },
  timeSince: {
    touchStart: new Date(),
    lastRequest: new Date()
  }
};

const onTouchStart = () => {
  state.deviceOrientation.onTouchStart = state.deviceOrientation.current;
  state.timeSince.touchStart = new Date();
};

const onTouchEnd = () => {
  if (state.color.onDeviceOrientation) {
    state.color.current = state.color.onDeviceOrientation;
  }

  delete state.deviceOrientation.onTouchStart;
  delete state.timeSince.touchStart;

  // if (!state.light) {
  //   return;
  // }

  // Lights.set(state.light.id, {
  //   transition: 2000,
  //   on: false
  // });
};

const onOrientation = ({ alpha, beta, gamma }: Device.Orientation) => {
  state.deviceOrientation.current = { alpha, beta, gamma };

  if (!state.deviceOrientation.onTouchStart) {
    state.light = World.lightFromAngle(360 - alpha);
    return;
  }

  const now = new Date();

  if (!state.timeSince.touchStart) {
    state.timeSince.touchStart = new Date();
    return;
  }

  if (now.getTime() - state.timeSince.touchStart.getTime() >= 200) {
    state.color.onDeviceOrientation = Color.withOrientationShift(
      state.color.current,
      Device.orientationDeltas(
        state.deviceOrientation.onTouchStart,
        state.deviceOrientation.current
      )
    );

    document.body.style.backgroundColor = Color.toHex(
      state.color.onDeviceOrientation
    );
  }

  if (
    state.light &&
    state.color.onDeviceOrientation &&
    now.getTime() - state.timeSince.lastRequest.getTime() >= 200
  ) {
    state.timeSince.lastRequest = now;

    Lights.set(state.light.id, {
      transition: 200,
      color: document.body.style.backgroundColor,
      on: state.color.onDeviceOrientation.luminosity !== 0
    });
  }
};

document.body.style.backgroundColor = "#000000";
document.body.style.userSelect = "none";

window.addEventListener("touchstart", onTouchStart as any, true);
window.addEventListener("touchend", onTouchEnd as any, true);
window.addEventListener("deviceorientation", onOrientation as any, true);
