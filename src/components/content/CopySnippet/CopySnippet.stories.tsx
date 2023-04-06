import { ComponentMeta, Story } from '@storybook/react';
import { SettingOutlined } from '@ant-design/icons';

import { baseProps } from '../../../stories/lists/baseProps';

import { CopySnippet, CubeCopySnippetProps } from './CopySnippet';

export default {
  title: 'Content/CopySnippet',
  component: CopySnippet,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
} as ComponentMeta<typeof CopySnippet>;

const Template: Story<CubeCopySnippetProps> = (args) => (
  <CopySnippet {...args} />
);

export const OneLine = Template.bind({});
OneLine.args = {
  code: 'npm install -g cubejs-cli',
  prefix: '$ ',
};

export const WithCustomButton = Template.bind({});
WithCustomButton.args = {
  code: 'npm install -g cubejs-cli',
  prefix: '$ ',
  actions: <CopySnippet.Button icon={<SettingOutlined />} />,
};

export const Hidden = Template.bind({});
Hidden.args = {
  code: 'f8eh53jr8sdnzv%rsk',
  hideText: true,
};

export const PartiallyHidden = Template.bind({});
PartiallyHidden.args = {
  code: 'ssh -l admin -p f8eh53jr8sdnzv%rsk',
  hideText: 'f8eh53jr8sdnzv%rsk',
};

export const PartiallyHiddenMultipleParts = Template.bind({});
PartiallyHiddenMultipleParts.args = {
  code: 'ssh -l admin -p f8eh53jr8sdnzv%rsk && ssh -l admin -p fdse3kr*3%ftgs',
  hideText: ['f8eh53jr8sdnzv%rsk', 'fdse3kr*3%ftgs'],
};

export const MultiLine = Template.bind({});
MultiLine.args = {
  code: 'npm install -g cubejs-cli\ncubejs deploy',
  prefix: '$ ',
};

export const WithScroll = Template.bind({});
WithScroll.args = {
  code: 'npm install -g cubejs-cli && cubejs deploy && npm install -g cubejs-cli && cubejs deploy && npm install -g cubejs-cli && cubejs deploy && npm install -g cubejs-cli && cubejs deploy',
  prefix: '$ ',
  styles: {
    width: 'max 300px',
  },
};

export const JavascriptSyntax = Template.bind({});
JavascriptSyntax.args = {
  language: 'javascript',
  code: `cube('LineItems', {
  sql: \`SELECT * FROM public.line_items\`,


  joins: {
    Products: {
      sql: \`\${CUBE}.product_id = \${Products}.id\`,
      relationship: \`belongsTo\`
    },

    Orders: {
      sql: \`\${CUBE}.order_id = \${Orders}.id\`,
      relationship: \`belongsTo\`
    }
  },

  measures: {
    count: {
      type: \`count\`,
      drillMembers: [id, createdAt]
    },

    price: {
      sql: \`price\`,
      type: \`sum\`
    },

    quantity: {
      sql: \`quantity\`,
      type: \`sum\`
    }
  },

  dimensions: {
    id: {
      sql: \`id\`,
      type: \`number\`,
      primaryKey: true
    },

    createdAt: {
      sql: \`created_at\`,
      type: \`time\`
    }
  }
});`,
};
