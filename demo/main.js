const Draft = require('draft-js');
const React = require('react');
const ReactDOM = require('react-dom');
const PrismDraftDecorator = require('draft-js-prism');
const CodeUtils = require('../lib');

const { Editor, EditorState, RichUtils, convertFromRaw } = Draft;

class PrismEditorExample extends React.Component {
  constructor(props) {
    super(props);

    var decorator = new PrismDraftDecorator({
      defaultSyntax: 'javascript',
    });
    var contentState = convertFromRaw({
      entityMap: {},
      blocks: [
        {
          type: 'header-one',
          text: 'Demo for draft-js-code',
        },
        {
          type: 'unstyled',
          text:
            'Type some JavaScript below, Use "Command+Return" (or "Ctrl+Return" on Windows) to split/exit a code blocks:',
        },
        {
          type: 'code-block',
          text: 'var message = "Hello World"',
        },
        {
          type: 'code-block',
          text: '    + "with four spaces indentation"',
        },
        {
          type: 'code-block',
          text: '',
        },
        {
          type: 'code-block',
          text: 'console.log(message);',
        },
        {
          type: 'unstyled',
          text: 'And this is a code block with 2 spaces indentation',
        },
        {
          type: 'code-block',
          text: 'var message = "Hello World"',
        },
        {
          type: 'code-block',
          text: '  + "with 2 spaces indentation"',
        },
        {
          type: 'code-block',
          text: '',
        },
        {
          type: 'code-block',
          text: 'console.log(message);',
        },
      ],
    });

    this.state = {
      editorState: EditorState.createWithContent(contentState, decorator),
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = editorState => this.setState({ editorState });

    this.handleKeyCommand = command => this._handleKeyCommand(command);
    this.onBeforeInput = (chars, editorState) =>
      this._onBeforeInput(chars, editorState);
    this.keyBindingFn = e => this._keyBindingFn(e);
    this.toggleBlockType = type => this._toggleBlockType(type);
    this.toggleInlineStyle = style => this._toggleInlineStyle(style);
    this.onTab = e => this._onTab(e);
    this.onReturn = (e, editorState) => this._onReturn(e, editorState);
  }

  _onBeforeInput(chars, editorState) {
    const newState = CodeUtils.handleBeforeInput(chars, editorState);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  _handleKeyCommand(command) {
    const { editorState } = this.state;
    let newState;

    if (CodeUtils.hasSelectionInBlock(editorState)) {
      newState = CodeUtils.handleKeyCommand(editorState, command);
    }

    if (!newState) {
      newState = RichUtils.handleKeyCommand(editorState, command);
    }

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  _keyBindingFn(e) {
    let editorState = this.state.editorState;
    let command;

    if (CodeUtils.hasSelectionInBlock(editorState)) {
      command = CodeUtils.getKeyBinding(e);
    }
    if (command) {
      return command;
    }

    return Draft.getDefaultKeyBinding(e);
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle),
    );
  }

  _onTab(e) {
    let editorState = this.state.editorState;

    if (!CodeUtils.hasSelectionInBlock(editorState)) {
      return;
    }

    this.onChange(CodeUtils.onTab(e, editorState));
  }

  _onReturn(e, editorState) {
    if (CodeUtils.hasSelectionInBlock(editorState)) {
      this.onChange(CodeUtils.handleReturn(e, editorState));
      return 'handled';
    }

    return 'not-handled';
  }

  render() {
    const { editorState } = this.state;

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = 'RichEditor-editor';
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (
        contentState
          .getBlockMap()
          .first()
          .getType() !== 'unstyled'
      ) {
        className += ' RichEditor-hidePlaceholder';
      }
    }

    return (
      <div className="RichEditor-root">
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div className={className} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            handleBeforeInput={this.onBeforeInput}
            keyBindingFn={this.keyBindingFn}
            onChange={this.onChange}
            placeholder="Tell a story..."
            ref="editor"
            spellCheck={true}
            handleReturn={this.onReturn}
            onTab={this.onTab}
          />
        </div>
      </div>
    );
  }
}

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = 'RichEditor-styleButton';
    if (this.props.active) {
      className += ' RichEditor-activeButton';
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote' },
  { label: 'UL', style: 'unordered-list-item' },
  { label: 'OL', style: 'ordered-list-item' },
  { label: 'Code Block', style: 'code-block' },
];

const BlockStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

var INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD' },
  { label: 'Italic', style: 'ITALIC' },
  { label: 'Underline', style: 'UNDERLINE' },
  { label: 'Monospace', style: 'CODE' },
];

const InlineStyleControls = props => {
  var currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

ReactDOM.render(<PrismEditorExample />, document.getElementById('target'));
