interface SymbolData {
  name: string;
  connections?: string[];
  value?: number;
}

const symbols: SymbolData[] = [
  {
    name: "education",
    connections: ["productive"],
    value: 9
  },
  {
    name: "family",
    connections: ["social"],
    value: 8
  },
  {
    name: "code",
    connections: ["productive"],
    value: 8
  },
  {
    name: "magic",
    connections: ["code"],
    value: 10
  },
  {
    name: "substance",
    value: -8
  },
  {
    name: "body",
    value: 7
  },
  {
    name: "browsing",
    connections: ["recreation"],
    value: -7
  },
  {
    name: "paragliding",
    connections: ["recreation", "productive"],
    value: 7
  },
  {
    name: "drinking",
    connections: ["substance", "recreation"],
    value: -7
  },
  {
    name: "mode",
    connections: ["code"],
    value: 6
  },
  {
    name: "house",
    connections: ["productive"],
    value: 6
  },
  {
    name: "ethql",
    connections: ["code"],
    value: 6
  },
  {
    name: "outside",
    value: 6
  },
  {
    name: "social",
    value: 5
  },
  {
    name: "productive",
    value: 5
  },
  {
    name: "friend",
    value: 5
  },
  {
    name: "reading",
    connections: ["productive"],
    value: 5
  },
  {
    name: "coworker",
    value: 5
  },
  {
    name: "weed",
    connections: ["substance", "recreation"],
    value: -5
  },
  {
    name: "memes",
    connections: ["recreation"],
    value: 4
  },
  {
    name: "nap",
    connections: ["recreation"],
    value: -4
  },
  {
    name: "carfax",
    value: 4
  },
  {
    name: "driving",
    connections: ["chore"],
    value: -3
  },
  {
    name: "meal",
    connections: ["body"],
    value: 2
  },
  {
    name: "chore",
    value: -1
  },
  {
    name: "recreation",
    value: -1
  },
  {
    name: "joe-bradish",
    connections: ["friend"]
  },
  {
    name: "david-abadir",
    connections: ["coworker"]
  },
  {
    name: "john-sabath",
    connections: ["friend", "coworker"]
  },
  {
    name: "todd-ruhl",
    connections: ["family"]
  },
  {
    name: "chip-uhlemeyer",
    connections: ["family"]
  },
  {
    name: "todd-elvers",
    connections: ["friend", "coworker"]
  },
  {
    name: "lexie-ruhl",
    connections: ["family"]
  },
  {
    name: "andy-hine",
    connections: ["friend", "coworker"]
  },
  {
    name: "kimberly-ruhl",
    connections: ["family"]
  },
  {
    name: "gary-uhlemeyer",
    connections: ["family"]
  },
  {
    name: "martha-uhlemeyer",
    connections: ["family"]
  },
  {
    name: "bathroom",
    connections: ["body", "chore"]
  },
  {
    name: "brian-fitzgerald",
    connections: ["friend", "coworker"]
  },
  {
    name: "hailey-wyant",
    connections: ["friend"]
  },
  {
    name: "conner-christopherson",
    connections: ["friend"]
  },
  {
    name: "ian-mcleod",
    connections: ["coworker"]
  },
  {
    name: "eleanor-ruhl",
    connections: ["family"]
  },
  {
    name: "ben-wagner",
    connections: ["friend"]
  },
  {
    name: "gary-brown",
    connections: ["coworker"]
  },
  {
    name: "alex-wilhelm",
    connections: ["friend"]
  },
  {
    name: "marissa-medlin",
    connections: ["friend"]
  },
  {
    name: "wayne-noonan",
    connections: ["friend", "coworker"]
  },
  {
    name: "trey-king",
    connections: ["friend"]
  },
  {
    name: "tom-galbraith",
    connections: ["family"]
  },
  {
    name: "sharnell-meeks",
    connections: ["friend"]
  },
  {
    name: "hunter-scheib",
    connections: ["friend", "coworker"]
  },
  {
    name: "kathy-dabin",
    connections: ["family"]
  },
  {
    name: "tom-dabin",
    connections: ["family"]
  },
  {
    name: "jacob-rice",
    connections: ["coworker"]
  }
];

export const all = () => symbols;
