import * as React from "react";

import { observer } from "mobx-react";
import { getStores } from "../stores";

import TagEditor from "./tag-editor";

const Info: React.SFC = observer(() => {
  const {
    activeTag,
    deleteNode,
    clearActiveNode,
    updateNode
  } = getStores().graph;
  const content = activeTag ? (
    <TagEditor
      key={activeTag.ID}
      tag={activeTag}
      update={basicTag => updateNode(basicTag)}
      delete={id => deleteNode(id)}
      cancel={() => clearActiveNode()}
    />
  ) : (
    <div>Select a node to edit it.</div>
  );
  return <div className="tagEditor-info">{content}</div>;
});

export default Info;
