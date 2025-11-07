/**
 * Command Implementations
 * 操作命令的具体实现
 */

import {
  Command,
  OperationType,
  StyleChangeCommand,
  ContentChangeCommand,
  ElementAddCommand,
  ElementDeleteCommand,
  ElementTagChangeCommand,
  BatchCommand,
} from './types';

/**
 * 创建元素标签变更命令
 */
export function createElementTagChangeCommand(
  element: HTMLElement,
  newTag: string
): ElementTagChangeCommand {
  const oldTag = element.tagName;
  const newElement = document.createElement(newTag);

  // Copy attributes
  for (const attr of Array.from(element.attributes)) {
    newElement.setAttribute(attr.name, attr.value);
  }

  const headingLevels: { [key: string]: string } = {
    H1: '28px',
    H2: '26px',
    H3: '24px',
    H4: '22px',
    H5: '20px',
    H6: '18px',
  };
  const upperCaseNewTag = newTag.toUpperCase();
  if (headingLevels[upperCaseNewTag]) {
    newElement.style.fontSize = headingLevels[upperCaseNewTag];
  } else {
    newElement.style.fontSize = '18px';
  }

  // Copy content
  newElement.innerHTML = element.innerHTML;

  return {
    type: OperationType.ELEMENT_TAG_CHANGE,
    timestamp: Date.now(),
    element,
    oldTag,
    newTag,
    newElement,

    execute() {
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
        this.element = newElement;
      }
    },

    undo() {
      if (newElement.parentNode) {
        newElement.parentNode.replaceChild(element, newElement);
        this.element = element;
      }
    },

    merge(): boolean {
      return false;
    },
  };
}

/**
 * 创建批量操作命令
 */
export function createStyleChangeCommand(
  element: HTMLElement,
  property: string,
  oldValue: string,
  newValue: string
): StyleChangeCommand {
  const time = Date.now();
  return {
    type: OperationType.STYLE_CHANGE,
    timestamp: time,
    element,
    property,
    oldValue,
    newValue,

    execute() {
      element.style.setProperty(property, newValue);
    },

    undo() {
      if (oldValue) {
        element.style.setProperty(property, oldValue);
      } else {
        element.style.removeProperty(property);
      }
    },

    merge(command: Command): boolean {
      if (
        command.type === OperationType.STYLE_CHANGE &&
        (command as StyleChangeCommand).element === element &&
        (command as StyleChangeCommand).property === property &&
        command.timestamp - time < 1000
      ) {
        this.newValue = (command as StyleChangeCommand).newValue;
        this.timestamp = command.timestamp;
        return true;
      }
      return false;
    },
  };
}

/**
 * 创建内容变更命令
 */
export function createContentChangeCommand(
  element: HTMLElement,
  oldContent: string,
  newContent: string
): ContentChangeCommand {
  return {
    type: OperationType.CONTENT_CHANGE,
    timestamp: Date.now(),
    element,
    oldContent,
    newContent,

    execute() {
      element.innerHTML = newContent;
    },

    undo() {
      element.innerHTML = oldContent;
    },

    merge(command: Command): boolean {
      if (
        command.type === OperationType.CONTENT_CHANGE &&
        (command as ContentChangeCommand).element === element &&
        Date.now() - command.timestamp < 2000
      ) {
        this.newContent = (command as ContentChangeCommand).newContent;
        this.timestamp = command.timestamp;
        return true;
      }
      return false;
    },
  };
}

/**
 * 创建元素添加命令
 */
export function createElementAddCommand(
  element: HTMLElement,
  parent: HTMLElement,
  nextSibling: HTMLElement | null
): ElementAddCommand {
  return {
    type: OperationType.ELEMENT_ADD,
    timestamp: Date.now(),
    element,
    parent,
    nextSibling,

    execute() {
      if (nextSibling) {
        parent.insertBefore(element, nextSibling);
      } else {
        parent.appendChild(element);
      }
    },

    undo() {
      parent.removeChild(element);
    },
  };
}

/**
 * 创建元素删除命令
 */
export function createElementDeleteCommand(
  element: HTMLElement,
  parent: HTMLElement,
  nextSibling: Node | null
): ElementDeleteCommand {
  return {
    type: OperationType.ELEMENT_DELETE,
    timestamp: Date.now(),
    element,
    parent,
    nextSibling,

    execute() {
      if (element.parentNode) {
        parent.removeChild(element);
      }
    },

    undo() {
      // 插回原节点对象
      if (!element.parentNode) {
        parent.insertBefore(element, nextSibling);
      }
    },
  };
}

/**
 * 创建批量操作命令
 */
export function createBatchCommand(commands: Command[]): BatchCommand {
  return {
    type: OperationType.BATCH,
    timestamp: Date.now(),
    commands,

    execute() {
      commands.forEach((cmd) => cmd.execute());
    },

    undo() {
      for (let i = commands.length - 1; i >= 0; i--) {
        commands[i].undo();
      }
    },
  };
}