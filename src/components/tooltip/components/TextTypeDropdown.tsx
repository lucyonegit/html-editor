import React from 'react';
import { Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { HTMLEditor } from '../../../lib';

interface TextTypeDropdownProps {
  editor: HTMLEditor;
  element: HTMLElement;
}

const textTypes: { [key: string]: string } = {
  '正文': 'p',
  'H1': 'h1',
  'H2': 'h2',
  'H3': 'h3',
  'H4': 'h4',
  'H5': 'h5',
  'H6': 'h6',
};

export const TextTypeDropdown: React.FC<TextTypeDropdownProps> = ({ editor, element }) => {
  const currentTag = element.tagName.toLowerCase();
  const currentTextType = Object.keys(textTypes).find(key => textTypes[key] === currentTag) || '正文';

  const handleMenuClick = (e: any) => {
      const newTag = textTypes[e.key as keyof typeof textTypes];
      if (newTag && editor && editor.styleManager) {
        editor.styleManager.changeElementTag(element, newTag);
      }
    };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {Object.keys(textTypes).map(type => (
        <Menu.Item key={type}>{type}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown overlay={menu}>
      <a onClick={e => e.preventDefault()}>
        {currentTextType} <DownOutlined />
      </a>
    </Dropdown>
  );
};