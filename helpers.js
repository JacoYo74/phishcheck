// helpers.js - tiny helpers for building page elements safely.
// We always use textContent, never innerHTML, because emails are untrusted.

/**
 * Makes an element with an optional class and text.
 *
 * Args:
 *   tag: the tag name, like "div".
 *   className: a class name, or "" for none.
 *   text: the text inside, or undefined for none.
 *
 * Returns:
 *   The new element.
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/**
 * Makes a button.
 *
 * Args:
 *   label: the text on the button.
 *   className: a class name, or "".
 *   action: the function to run on click.
 *
 * Returns:
 *   The button element.
 */
function makeButton(label, className, action) {
  const button = el("button", className, label);
  button.type = "button";
  button.onclick = action;
  return button;
}

/**
 * Removes everything inside an element.
 *
 * Args:
 *   node: the element to empty.
 */
function clear(node) {
  node.textContent = "";
}

/**
 * Opens a dialog, with a fallback for browsers without showModal.
 *
 * Args:
 *   dialog: the dialog element.
 */
function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

/**
 * Closes a dialog.
 *
 * Args:
 *   dialog: the dialog element.
 */
function closeDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}
