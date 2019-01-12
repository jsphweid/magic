import * as React from "react";

import { observer } from "mobx-react";
import { getStores } from "../stores";

import Instructions from "./instructions";
import TagEditor from "./tag-editor";

const Sidebar: React.SFC = observer(() => {
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
      update={tag => updateNode(tag)}
      delete={id => deleteNode(id)}
      cancel={() => clearActiveNode()}
    />
  ) : null;
  const loading = getStores().apiInterface.isLoading ? "loading..." : null;
  return (
    <div className="tagEditor-sidebar">
      <Instructions />
      {content}
      {loading}
    </div>
  );
});

export default Sidebar;
