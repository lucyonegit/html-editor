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
  BatchCommand,
} from './types';

/**
 * 创建样式变更命令
 */
export function createStyleChangeCommand(
  element: HTMLElement,
  property: string,
  oldValue: string,
  newValue: string
): StyleChangeCommand {
  return {
    type: OperationType.STYLE_CHANGE,
    timestamp: Date.now(),
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
        Date.now() - command.timestamp < 1000
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
  nextSibling: HTMLElement | null
): ElementDeleteCommand {
  return {
    type: OperationType.ELEMENT_DELETE,
    timestamp: Date.now(),
    element,
    parent,
    nextSibling,
    elementHTML: element.outerHTML,

    execute() {
      parent.removeChild(element);
    },

    undo() {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.elementHTML;
      const restoredElement = tempDiv.firstChild as HTMLElement;

      if (nextSibling) {
        parent.insertBefore(restoredElement, nextSibling);
      } else {
        parent.appendChild(restoredElement);
      }

      this.element = restoredElement;
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