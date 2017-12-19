# draft-js-code-custom

This is a fork of [draft-js-code](https://github.com/SamyPesse/draft-js-code)

### Attention
It differs from the original package by slanting to work in conditions where each line is a separate `CodeBlock`. You must provide such conditions by yourself.

[![NPM version](https://badge.fury.io/js/draft-js-code.svg)](http://badge.fury.io/js/draft-js-code)
[![Coverage Status](https://coveralls.io/repos/github/SamyPesse/draft-js-code/badge.svg?branch=master)](https://coveralls.io/github/SamyPesse/draft-js-code?branch=master)

`draft-js-code-custom` is a collection of low-level utilities to make code block editing in DraftJS editors nicer.

<!-- If you're using `draft-js-plugins`, check out the [`draft-js-code-plugin`](https://github.com/withspectrum/draft-js-code-plugin) wrapper around this library. -->

It works well with [`draft-js-prism`](https://github.com/SamyPesse/draft-js-prism) or [`draft-js-prism-plugin`](https://github.com/withspectrum/draft-js-prism-plugin).

### Features

- [x] Indent with <kbd>TAB</kbd>
- [x] Indent with <kbd>TAB</kbd> then several lines selected
- [x] Insert new line with correct indentation with <kbd>ENTER</kbd>
- [x] Remove indentation from text beginning (if needed) with <kbd>backspace</kbd>
- [x] Return from indentation to previous line with <kbd>backspace</kbd> if the context assumes this
- [x] Remove indentation with <kbd>SHIFT</kbd>+<kbd>TAB</kbd> ([#6](https://github.com/SamyPesse/draft-js-code/issues/6))
- [x] Remove indentation with <kbd>SHIFT</kbd>+<kbd>TAB</kbd> for several lines
- [x] Handle input of pair characters like `()`, `[]`, `{}`, `""`, `''`, ` `` `, etc. ([#3](https://github.com/SamyPesse/draft-js-code/issues/3))
- [x] Implement code block depth based on pair characters
- [x] Move cursor to the text beginning with <kbd>HOME</kbd>
- [x] Duplicate current line or selected block with <kbd>CTRL</kbd>+<kbd>D</kbd>
- [x] Delete line at caret with <kbd>CTRL</kbd>+<kbd>Y</kbd>

### Installation

```bash
$ npm install draft-js-code-custom --save
```

### API

```js
import  {
  hasSelectionInBlock,
  onTab,
  handleReturn,
  handleKeyCommand,
  handleBeforeInput
} from 'draft-js-code-custom'
```

##### `hasSelectionInBlock(editorState)`

Returns true if user is editing a code block. You should call this method to encapsulate all other methods when limiting code edition behaviour to `code-block`.

##### `handleKeyCommand(editorState, command)`

Handle key command for code blocks, returns a new `EditorState` or `undefined`.

##### `onTab(e, editorState)`

Handle user pressing tab, to insert indentation, it returns a new `EditorState`.

##### `handleReturn(e, editorState)`

Handle user pressing return, to insert a new line inside the code block, it returns a new `EditorState`.

##### `handleBeforeInput(char, editorState)`

Handle inserting pair of special characters, line `()`, `""`, etc. Returns a new `EditorState` or `undefined`.

### Usage

```js
import React from 'react';
import Draft from 'draft-js';
import CodeUtils from 'draft-js-code';

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: Draft.EditorState.createEmpty()
    };
  }

  onChange = (editorState) => {
    this.setState({
      editorState
    })
  }

  onBeforeInput = (chars, editorState) => {
    const newState = handleBeforeInput(chars, editorState);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  handleKeyCommand = (command) => {
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

  keyBindingFn = (evt) => {
    const { editorState } = this.state;
    if (!CodeUtils.hasSelectionInBlock(editorState)) return Draft.getDefaultKeyBinding(evt);

    const command = CodeUtils.getKeyBinding(evt);

    return command || Draft.getDefaultKeyBinding(evt);
  }

  handleReturn = (evt) => {
    const { editorState } = this.state;
    if (!CodeUtils.hasSelectionInBlock(editorState)) return 'not-handled';

    this.onChange(CodeUtils.handleReturn(evt, editorState));
    return 'handled';
  }

  onTab = (evt) => {
    const { editorState } = this.state;
    if (!CodeUtils.hasSelectionInBlock(editorState)) return 'not-handled';

    const newState = CodeUtils.onTab(evt, editorState);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  render() {
    return (
      <Draft.Editor
        editorState={this.state.editorState}
        onChange={this.onChange}
        keyBindingFn={this.keyBindingFn}
        handleBeforeInput={this.onBeforeInput}
        handleKeyCommand={this.handleKeyCommand}
        handleReturn={this.handleReturn}
        onTab={this.onTab}
      />
    );
  }
}
```
