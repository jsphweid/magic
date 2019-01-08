import * as React from "react";

import { Tag } from "../../__generatedTypes__";

import TagsInput from "react-tagsinput";

interface TagEditorProps {
  tag: Tag;
  update: (tag: BasicTag) => void;
  cancel: () => void;
}

export interface BasicTag {
  ID: string;
  name: string;
  aliases: string[];
  score: number;
}

export default class TagEditor extends React.Component<
  TagEditorProps,
  BasicTag
> {
  constructor(props: TagEditorProps) {
    super(props);
    this.state = {
      ...this.props.tag
    };
  }

  private handleUpdateClick = () => {
    this.props.update({ ...this.state });
  };

  public render() {
    const isUnedited =
      JSON.stringify(this.state) === JSON.stringify(this.props.tag);
    return (
      <div className="tagEditor-tagEditor">
        <table>
          <tbody>
            <tr>
              <td>name:</td>
              <td>
                <input
                  value={this.state.name}
                  onChange={e => this.setState({ name: e.currentTarget.value })}
                />
              </td>
            </tr>

            <tr>
              <td>score:</td>
              <td>
                <input
                  value={this.state.score}
                  onChange={e =>
                    this.setState({
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
                  value={this.state.aliases}
                  onChange={e => this.setState({ aliases: e })}
                  inputProps={{ placeholder: "Add an alias and press tab" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="tagEditor-tagEditor-buttons">
          <button disabled={isUnedited} onClick={this.handleUpdateClick}>
            save
          </button>
          <button onClick={this.props.cancel}>cancel</button>
        </div>
      </div>
    );
  }
}
