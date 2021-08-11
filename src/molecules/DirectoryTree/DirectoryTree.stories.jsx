import { DirectoryTree } from './DirectoryTree';

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

const TREE_DIFF_DATA = [
  {
    title: 'schema',
    key: '/schema',
    children: [
      {
        title: 'LineItems.js',
        key: '/schema/LineItems.js',
        isLeaf: true,
        mode: 'modified',
      },
      {
        title: 'Orders.js',
        key: '/schema/Orders.js',
        mode: 'modified',
        isLeaf: true,
      },
      {
        title: 'ProductCategories.js',
        key: '/schema/ProductCategories.js',
        isLeaf: true,
        mode: 'created',
      },
      {
        title: 'Products.js',
        key: '/schema/Products.js',
        isLeaf: true,
        mode: 'modified',
      },
      {
        title: 'Suppliers.js',
        key: '/schema/Suppliers.js',
        isLeaf: true,
        mode: 'deleted',
      },
    ],
    isLeaf: false,
  },
  {
    title: 'package.json',
    key: '/package.json',
    isLeaf: true,
    mode: 'modified',
  },
  {
    title: 'cube.js',
    key: '/cube.js',
    isLeaf: true,
    mode: 'modified',
  },
];

export default {
  title: 'UIKit/Molecules/DirectoryTree',
  component: DirectoryTree,
  argTypes: {},
};

const Template = (props) => <DirectoryTree {...props} />;

export const Default = Template.bind({});
Default.args = {
  defaultExpandAll: true,
  treeData: TREE_DATA,
};

export const Diff = Template.bind({});
Diff.args = {
  defaultExpandAll: true,
  treeData: TREE_DIFF_DATA,
};
