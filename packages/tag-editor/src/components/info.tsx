import * as React from "react";

import { observer } from "mobx-react";
import { getStores } from "../stores";

import { Tag } from "../../__generatedTypes__";

const Info: React.SFC = observer(() => {
  console.log("rendering info");
  const renderActiveTag = ({ ID, name, aliases, score }: Tag): JSX.Element => (
    <div>
      <div>id: {ID}</div>
      <div>name: {name}</div>
      <div>aliases: {aliases.join(", ")}</div>
      <div>score: {score}</div>
      <div>connections: look at the graph for now...</div>
    </div>
  );

  const { activeTag } = getStores().graph;
  const content = activeTag ? renderActiveTag(activeTag) : null;
  return (
    <div style={{ border: "1px solid grey", height: "200px" }}>{content}</div>
  );
});

export default Info;
