import * as React from "react";

import { observer } from "mobx-react";
import { getStores } from "../stores";

import TagEditor from "./tag-editor";

const Info: React.SFC = observer(() => {
  const { activeTag } = getStores().graph;
  const content = activeTag ? (
    <TagEditor
      key={activeTag.ID}
      tag={activeTag}
      update={() => console.log("update")}
      delete={id => getStores().apiInterface.deleteTag(id)}
      cancel={() => getStores().graph.clearActiveNode()}
    />
  ) : (
    <div>Select a node to edit it.</div>
  );
  return <div className="tagEditor-info">{content}</div>;
});

export default Info;
