import React from 'react';

import UIKitDirectoryTree from '../components/DirectoryTree';

const TREE_DATA = [
  {
    title: 'schema',
    key: '/schema',
    children: [
      {
        title: 'LineItems.js',
        key: '/schema/LineItems.js',
        isLeaf: true,
      },
      {
        title: 'Orders.js',
        key: '/schema/Orders.js',
        isLeaf: true,
      },
      {
        title: 'ProductCategories.js',
        key: '/schema/ProductCategories.js',
        isLeaf: true,
      },
      {
        title: 'Products.js',
        key: '/schema/Products.js',
        isLeaf: true,
      },
      {
        title: 'Suppliers.js',
        key: '/schema/Suppliers.js',
        isLeaf: true,
      },
      { title: 'Users.js', key: '/schema/Users.js', isLeaf: true },
    ],
    isLeaf: false,
  },
  {
    title: 'package.json',
    key: '/package.json',
    isLeaf: true,
  },
  {
    title: 'package-lock.json',
    key: '/package-lock.json',
    isLeaf: true,
  },
  {
    title: 'docker-compose.yml',
    key: '/docker-compose.yml',
    isLeaf: true,
  },
  { title: 'cube.js', key: '/cube.js', isLeaf: true },
];

// fix component name
const DirectoryTree = (args) => <UIKitDirectoryTree {...args} />;

export default {
  title: 'Example/DirectoryTree',
  component: DirectoryTree,
  argTypes: {},
};

const Template = (props) => <DirectoryTree treeData={TREE_DATA} {...props} />;

export const Default = Template.bind({});
Default.args = {
  defaultExpandAll: true,
};
