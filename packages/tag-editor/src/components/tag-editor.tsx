import * as React from "react";

import TagsInput from "react-tagsinput";
import { Tag } from "../types";

interface TagEditorProps {
  tag: Tag;
  update: (tag: Tag) => void;
  delete: (id: string) => void;
  cancel: () => void;
}

interface TagEditorState {
  tag: Tag;
  deleteConfirmation: boolean;
}

export default class TagEditor extends React.Component<
  TagEditorProps,
  TagEditorState
> {
  constructor(props: TagEditorProps) {
    super(props);
    this.state = {
      tag: { ...this.props.tag },
      deleteConfirmation: false
    };
  }

  private handleUpdateClick = () => {
    this.props.update(this.state.tag);
  };

  private updateTagProperties = (updates: Partial<Tag>) => {
    this.setState({ tag: { ...this.state.tag, ...updates } });
  };

  private renderDeleteConfirmation = () => (
    <div>
      <p>
        Deleting this will delete this tag and all of it's relationships
        forever. Are you sure?
      </p>
      <button onClick={() => this.props.delete(this.state.tag.ID)}>
        delete
      </button>
      <button onClick={() => this.setState({ deleteConfirmation: false })}>
        nevermind
      </button>
    </div>
  );

  private renderTable = () => (
    <div>
      <table>
        <tbody>
          <tr>
            <td>name:</td>
            <td>
              <input
                value={this.state.tag.name}
                onChange={e =>
                  this.updateTagProperties({ name: e.currentTarget.value })
                }
              />
            </td>
          </tr>

          <tr>
            <td>score:</td>
            <td>
              <input
                value={this.state.tag.score}
                onChange={e =>
                  this.updateTagProperties({
                    score: parseInt(e.currentTarget.value || "0")
                  })
                }
              />
            </td>
          </tr>

          <tr>
            <td>aliases:</td>
            <td>
              <TagsInput
                value={this.state.tag.aliases}
                onChange={e =>
                  this.updateTagProperties({
                    aliases: e
                  })
                }
                inputProps={{ placeholder: "Add an alias and press tab" }}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="tagEditor-tagEditor-buttons">
        <button
          disabled={
            JSON.stringify(this.state.tag) === JSON.stringify(this.props.tag)
          }
          onClick={this.handleUpdateClick}
        >
          save
        </button>
        <button onClick={this.props.cancel}>cancel</button>
        <button onClick={() => this.setState({ deleteConfirmation: true })}>
          delete
        </button>
      </div>
    </div>
  );

  public render() {
    const content = this.state.deleteConfirmation
      ? this.renderDeleteConfirmation()
      : this.renderTable();

    return <div className="tagEditor-tagEditor">{content}</div>;
  }
}
