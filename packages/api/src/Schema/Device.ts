import gql from "graphql-tag";

export const schema = gql`
  type Device implements Node {
    ID: ID!
    name: String!
    capabilities: Capabilities!
    usages(selection: TimeSelection): [Device__Usage!]!
  }

  interface, 

  type Device__Usage implements Node, Time__Timed {
    time: Time__Timing!
    device: Device!
    interaction: Interaction!
  }

  type Device__App
`;

// "start_time": 1542492066,
// "end_time": 1542492111,
// "desktop_id": "7f93c63e-e228-45dc-8414-58e4e630a4b6",
// "filename": "LockApp.exe",
// "title": "Windows Default Lock Screen",
// "idle": false
