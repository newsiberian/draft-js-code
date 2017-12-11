var Draft = require('draft-js');
var endsWith = require('ends-with');
var detectIndent = require('detect-indent');

var getNewLine = require('./getNewLine');
var getIndentation = require('./getIndentation');
var getLines = require('./getLines');
var getLineAnchorForOffset = require('./getLineAnchorForOffset');

/**
 * Remove last indentation before cursor, return undefined if no modification is done
 *
 * @param {Draft.EditorState} editorState
 * @param {Boolean} isShiftTab
 * @return {Draft.EditorState|undefined}
 */
function removeIndent(editorState, isShiftTab) {
  var contentState = editorState.getCurrentContent();
  var selection = editorState.getSelection();

  // backspace pressing with selection should remove selection
  if (!selection.isCollapsed() && !isShiftTab) {
    return;
  }

  var startKey = selection.getStartKey();
  var endKey = startKey;
  var startOffset = selection.getStartOffset();
  var currentBlock = contentState.getBlockForKey(startKey);
  var blockText = currentBlock.getText();

  // Detect newline separator and indentation
  var newLine = getNewLine(blockText);
  var indent = '    '; //getIndentation(blockText);

  // Get current line
  var lines = getLines(blockText, newLine);
  var lineAnchor = getLineAnchorForOffset(blockText, startOffset, newLine);

  var currentLine = lines.get(lineAnchor.getLine());
  var currentIndent = detectIndent(currentLine).amount;

  var rangeToRemove;
  var newState = {
    editorState: editorState,
    contentState: contentState
  };

  if (isShiftTab) {
    // if endKey differ from startKey this means that several lines selected and
    // we should remove indent from each (if possible)
    endKey = selection.getEndKey();
    if (endKey !== startKey) {
      var state = false;
      var endPassed = false;
      // we need to collect selected lines indents for further selection calibration
      var linesIndents = {};
      var selectedBlocksRange = contentState
        .getBlockMap()
        .filter((value, key) => {
          if (endPassed) {
            return false;
          } else if (key === startKey) {
            state = true;
          } else if (key === endKey) {
            endPassed = true;
          }
          return state;
        });

      selectedBlocksRange.forEach((block, key) => {
        newState = removeIndentFromLine(
          newState.editorState,
          newState.contentState,
          selection,
          block,
          key,
          indent
        );
        linesIndents[key] = newState.currentIndent;
      });

      var calibratedAnchorOffset = function(offset, lineIndent, indent) {
        if (lineIndent === 0) {
          return offset;
        }

        if (offset < lineIndent) {
          if (lineIndent > indent) {
            return offset;
          }
          return 0;
        }

        return lineIndent >= indent ? offset - indent : offset - lineIndent;
      };

      newState.contentState = !selection.isBackward
        ? calibrateCursor(
            newState.contentState,
            selection,
            startKey,
            endKey,
            calibratedAnchorOffset(
              selection.get('anchorOffset'),
              linesIndents[startKey],
              indent.length
            ),
            calibratedAnchorOffset(
              selection.get('focusOffset'),
              linesIndents[endKey],
              indent.length
            ),
            selection.isBackward
          )
        : calibrateCursor(
            newState.contentState,
            selection,
            endKey,
            startKey,
            calibratedAnchorOffset(
              selection.get('anchorOffset'),
              linesIndents[endKey],
              indent.length
            ),
            calibratedAnchorOffset(
              selection.get('focusOffset'),
              linesIndents[startKey],
              indent.length
            ),
            selection.isBackward
          );
    } else {
      // exit if no indent
      if (currentLine[0] !== ' ') {
        return editorState;
      }

      // we need to remove any number of spaces <= indent.length
      // i.e. if indent is 4, but we have 2 spaces on in the beginning of this line
      // we removing these 2
      var indentOffset =
        currentIndent < indent.length ? currentIndent : indent.length;
      // FIXME: this is dummy for testing purpose
      // var indentOffset = currentIndent < 4 ? currentIndent : 4;
      rangeToRemove = selection.merge({
        focusKey: startKey,
        focusOffset: indentOffset,
        anchorKey: startKey,
        anchorOffset: 0,
        isBackward: false
      });

      newState = modifyEditorState(
        editorState,
        contentState,
        rangeToRemove,
        true
      );
      newState.contentState = calibrateCursor(
        newState.contentState,
        selection,
        startKey,
        endKey,
        selection.get('anchorOffset') - indent.length,
        // FIXME: this is dummy for testing purpose
        // selection.get('anchorOffset') - 4,
        selection.get('focusOffset') - indent.length
        // FIXME: this is dummy for testing purpose
        // selection.get('focusOffset') - 4
      );
    }
  } else {
    var targetKey;
    var targetOffset;
    var isCursorOffsetEqualToIndent = currentIndent === startOffset;
    var isIndentLowerThanNativeIndent = currentIndent < indent.length;

    if (
      currentIndent < startOffset ||
      (isCursorOffsetEqualToIndent && isIndentLowerThanNativeIndent)
    ) {
      // second check for cases when text is closer to the line beginning than
      // indent, then we don't do anything here
      return;
    } else if (
      startOffset <= currentIndent &&
      currentIndent === indent.length
    ) {
      // if text begins from the position of indent, we should move it to
      // previous line if exist
      var blockBefore = contentState
        .getBlockMap()
        .toSeq()
        .takeUntil(contentBlock => contentBlock === currentBlock)
        .last();

      if (typeof blockBefore !== 'undefined') {
        targetKey = blockBefore.getKey();
        targetOffset = blockBefore.getLength();
      }
    }

    // Remove space before indent
    rangeToRemove = selection.merge({
      focusKey: targetKey || startKey,
      focusOffset: targetKey ? targetOffset : indent.length,
      anchorKey: startKey,
      anchorOffset: currentIndent,
      isBackward: true
    });

    newState = modifyEditorState(
      editorState,
      contentState,
      rangeToRemove,
      false
    );
  }

  return Draft.EditorState.forceSelection(
    newState.editorState,
    newState.contentState.getSelectionAfter()
  );
}

function removeIndentFromLine(
  editorState,
  contentState,
  selection,
  block,
  blockKey,
  indent
) {
  var text = block.getText();
  var newLine = getNewLine(text);
  var lines = getLines(text, newLine);
  var lineAnchor = getLineAnchorForOffset(text, 0, newLine);
  var currentLine = lines.get(lineAnchor.getLine());
  var currentIndent = detectIndent(currentLine).amount;

  if (currentIndent === 0) {
    return {
      editorState: editorState,
      contentState: contentState,
      currentIndent: currentIndent
    };
  }

  var rangeToRemove = selection.merge({
    focusKey: blockKey,
    focusOffset:
      currentIndent >= indent.length ? currentIndent - indent.length : 0,
    anchorKey: blockKey,
    anchorOffset: currentIndent,
    isBackward: true
  });

  var newState = modifyEditorState(
    editorState,
    contentState,
    rangeToRemove,
    true
  );

  return {
    editorState: newState.editorState,
    contentState: newState.contentState,
    currentIndent: currentIndent
  };
}

function calibrateCursor(
  contentState,
  selection,
  anchorKey,
  focusKey,
  anchorOffset,
  focusOffset
) {
  return contentState.merge({
    selectionAfter: selection.merge({
      anchorKey: anchorKey,
      anchorOffset: anchorOffset,
      focusKey: focusKey,
      focusOffset: focusOffset
    })
  });
}

function modifyEditorState(editorState, contentState, rangeToRemove) {
  var newContentState = Draft.Modifier.removeRange(
    contentState,
    rangeToRemove,
    'backward'
  );
  var newEditorState = Draft.EditorState.push(
    editorState,
    newContentState,
    'remove-range'
  );

  return {
    editorState: newEditorState,
    contentState: newContentState
  };
}

module.exports = removeIndent;
