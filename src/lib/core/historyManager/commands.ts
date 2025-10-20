/**
 * Command Implementations
 * 各种操作命令的具体实现
 */

import {
  Command,
  OperationType,
  StyleChangeCommand,
  ContentChangeCommand,
  ElementAddCommand,
  ElementDeleteCommand,
  ElementMoveCommand,
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
      // 只合并相同元素、相同属性的样式变更
      if (
        command.type === OperationType.STYLE_CHANGE &&
        (command as StyleChangeCommand).element === element &&
        (command as StyleChangeCommand).property === property &&
        Date.now() - command.timestamp < 1000 // 1秒内的操作可以合并
      ) {
        // 更新新值，但保留原始旧值
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
      // 连续的内容变更可以合并
      if (
        command.type === OperationType.CONTENT_CHANGE &&
        (command as ContentChangeCommand).element === element &&
        Date.now() - command.timestamp < 2000 // 2秒内的输入可以合并
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
      // 创建新元素并恢复
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.elementHTML;
      const restoredElement = tempDiv.firstChild as HTMLElement;

      if (nextSibling) {
        parent.insertBefore(restoredElement, nextSibling);
      } else {
        parent.appendChild(restoredElement);
      }

      // 更新引用
      this.element = restoredElement;
    },
  };
}

/**
 * 创建元素移动命令
 */
export function createElementMoveCommand(
  element: HTMLElement,
  oldParent: HTMLElement,
  newParent: HTMLElement,
  oldNextSibling: HTMLElement | null,
  newNextSibling: HTMLElement | null,
  oldPosition?: { x: number; y: number },
  newPosition?: { x: number; y: number }
): ElementMoveCommand {
  return {
    type: OperationType.ELEMENT_MOVE,
    timestamp: Date.now(),
    element,
    oldParent,
    newParent,
    oldNextSibling,
    newNextSibling,
    oldPosition,
    newPosition,

    execute() {
      // 移动到新位置
      if (newNextSibling) {
        newParent.insertBefore(element, newNextSibling);
      } else {
        newParent.appendChild(element);
      }

      // 应用新位置
      if (newPosition) {
        element.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;
      }
    },

    undo() {
      // 移回原位置
      if (oldNextSibling) {
        oldParent.insertBefore(element, oldNextSibling);
      } else {
        oldParent.appendChild(element);
      }

      // 恢复原位置
      if (oldPosition) {
        element.style.transform = `translate(${oldPosition.x}px, ${oldPosition.y}px)`;
      } else {
        element.style.removeProperty('transform');
      }
    },

    merge(command: Command): boolean {
      // 连续的移动操作可以合并
      if (
        command.type === OperationType.ELEMENT_MOVE &&
        (command as ElementMoveCommand).element === element &&
        Date.now() - command.timestamp < 500 // 500毫秒内的移动可以合并
      ) {
        const moveCmd = command as ElementMoveCommand;
        this.newParent = moveCmd.newParent;
        this.newNextSibling = moveCmd.newNextSibling;
        this.newPosition = moveCmd.newPosition;
        this.timestamp = command.timestamp;
        return true;
      }
      return false;
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
      // 反向执行撤销
      for (let i = commands.length - 1; i >= 0; i--) {
        commands[i].undo();
      }
    },
  };
}
