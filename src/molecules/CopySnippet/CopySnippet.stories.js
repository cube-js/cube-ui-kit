import React from 'react';
import { CopySnippet } from './CopySnippet';

export default {
  title: 'UIKit/Molecules/CopySnippet',
  component: CopySnippet,
  argTypes: {
    language: {
      control: {
        type: 'inline-radio',
        options: ['bash', 'javascript', 'yaml', 'json'],
      },
      description: 'Language for tokenization',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'bash' },
      },
    },
    title: {
      control: 'text',
      description:
        'A title of the code example that will be shown in notification on copy',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Code example' },
      },
    },
    code: {
      control: 'text',
      description: 'Code example',
      table: {
        type: { summary: 'string' },
      },
    },
    // overlay: {
    //   name: 'overlay',
    //   control: 'boolean',
    //   description: 'Show smooth gradient on the right side before COPY button',
    //   defaultValue: true,
    //   table: {
    //     type: { summary: 'boolean' },
    //     defaultValue: { summary: true },
    //   },
    // },
    nowrap: {
      control: 'boolean',
      description: 'Show code in a single line',
      defaultValue: false,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    scroll: {
      control: 'boolean',
      description: 'Show scroll if code is bigger that the widget area',
      defaultValue: true,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    serif: {
      control: 'boolean',
      description: 'Use Serif font family instead of monospace',
      defaultValue: false,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    prefix: {
      control: 'text',
      description:
        'A prefix before each line of the code. Does not affect copied text.',
      defaultValue: '',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: '' },
      },
    },
  },
};

const Template = (args) => <CopySnippet {...args} />;

export const OneLine = Template.bind({});
OneLine.args = {
  code: 'npm install -g cubejs-cli',
  prefix: '$ ',
};

export const MultiLine = Template.bind({});
MultiLine.args = {
  code: 'npm install -g cubejs-cli\ncubejs deploy',
  prefix: '$ ',
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
