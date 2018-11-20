import gql from "graphql-tag";

export const schema = gql`
  type Device implements Node {
    ID: ID!
    name: String!
    capabilities: Capabilities!
    usages(selection: TimeSelection): DeviceUsageHistory!
  }

  type Capabilities {
    inputs: [Input!]!
    outputs: [Output!]!
  }

  type Usages implements Time__Timed {
    interval: Interval!
    usages: [Usage!]!
  }

  type Usage implements Node, Time__Timed {
    time: Time__Timing!
    device: Device!
    interaction: Interaction!
  }

  enum Input {
    MOUSE
    DESKTOP
    VOICE
    TEXT
    TOUCH
  }

  enum Output {
    AUDIO
    SPEECH
    SCREEN
    TEXT
    LIGHT
  }
`;

// start_time: number;
// end_time: number;
// desktop_id: "a39122b6-e310-4620-9cae-53fb9738c0b8";
// filename: string;
// title: string;
// idle: boolean;
