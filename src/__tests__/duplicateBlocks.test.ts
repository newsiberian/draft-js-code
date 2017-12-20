import { EditorState } from 'draft-js';

import duplicateBlocks from '../utils/duplicateBlocks';
import {
  toPlainText,
  contentWithThreeBlocks,
  createSelection,
  firstText,
  secondText,
  thirdText,
} from './utils';

it('should duplicate current block with collapsed selection', () => {
  const selection = createSelection(contentWithThreeBlocks);
  const editorState = EditorState.create({
    currentContent: contentWithThreeBlocks,
    selection,
  });

  const result = duplicateBlocks(editorState);

  // before:
  // v <- caret here
  // function () {
  //   const x = 'hello';
  //       const str = `this is test`;
  //
  // after:
  // function () {
  // function () { <-- duplicate
  //   const x = 'hello';
  //       const str = `this is test`;

  expect(toPlainText(result)).toEqual(
    `${firstText}\n${firstText}\n${secondText}\n${thirdText}`,
  );
});

it('should duplicate selected text right after selection end', () => {
  const selection = createSelection(contentWithThreeBlocks)
    .set('anchorKey', 'a1')
    .set('anchorOffset', 9)
    .set('focusKey', 'a2')
    .set('focusOffset', 12);
  const editorState = EditorState.create({
    currentContent: contentWithThreeBlocks,
    selection,
  });

  const result = duplicateBlocks(editorState);
  // before:
  //          v <- anchor offset here
  // function () {
  //   const x = 'hello';
  //             ^ focus offset here
  //       const str = `this is test`;
  //
  // after:
  // function () {
  //   const x = () {
  //   const x = 'hello';
  //       const str = `this is test`;
  expect(toPlainText(result)).toEqual(
    `${firstText}\n${secondText.slice(0, 12)}${firstText.slice(
      9,
    )}\n${secondText}\n${thirdText}`,
  );
});

it('should duplicate selected text within one block', () => {
  const selection = createSelection(contentWithThreeBlocks)
    .set('anchorKey', 'a1')
    .set('anchorOffset', 9)
    .set('focusKey', 'a1')
    .set('focusOffset', 12);
  const editorState = EditorState.create({
    currentContent: contentWithThreeBlocks,
    selection,
  });

  // before:
  //         v <- anchor offset here
  // function () {
  //             ^ focus offset here
  //   const x = 'hello';
  //       const str = `this is test`;
  //
  // after:
  // function () () {
  //   const x = 'hello';
  //       const str = `this is test`;
  const result = duplicateBlocks(editorState);
  expect(toPlainText(result)).toEqual(
    `${firstText.slice(0, 12)}${firstText.slice(9, 12)}${firstText.slice(
      12,
    )}\n${secondText}\n${thirdText}`,
  );
});

it('should duplicate more than two blocks', () => {
  const selection = createSelection(contentWithThreeBlocks)
    .set('anchorKey', 'a1')
    .set('anchorOffset', 9)
    .set('focusKey', 'a3')
    .set('focusOffset', 18);
  const editorState = EditorState.create({
    currentContent: contentWithThreeBlocks,
    selection,
  });

  const result = duplicateBlocks(editorState);
  // before:
  //          v <- anchor offset here
  // function () {
  //   const x = 'hello';
  //       const str = `this is test`;
  //                   ^ focus offset here
  //
  // after:
  // function () {
  //   const x = 'hello';
  //       const str = () {
  //   const x = 'hello';
  //       const str = `this is test`;
  expect(toPlainText(result)).toEqual(
    `${firstText}\n${secondText}\n${thirdText.slice(0, 18)}${firstText.slice(
      9,
    )}\n${secondText}\n${thirdText}`,
  );
});
