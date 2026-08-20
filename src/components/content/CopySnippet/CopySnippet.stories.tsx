import { Meta, StoryFn } from '@storybook/react-vite';
import { IconSettings } from '@tabler/icons-react';

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
} as Meta<typeof CopySnippet>;

const Template: StoryFn<CubeCopySnippetProps> = (args) => (
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
  actions: <CopySnippet.Button icon={<IconSettings />} />,
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

export const Wrap = Template.bind({});
Wrap.args = {
  code: 'XMLA Internal Error: Arrow error: External error: Database Execution Error: Internal: Error during planning: Error decoding LogicalPlanNode.logical_plan_type:SubqueryAliasNode.input as protobuf message',
  language: 'bash',
  wrap: true,
  styles: {
    width: 'max 400px',
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

export const HtmlSyntax = Template.bind({});
HtmlSyntax.args = {
  language: 'html',
  code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cube Dashboard</title>
    <link rel="stylesheet" href="/assets/dashboard.css" />
  </head>
  <body>
    <header class="topbar" data-qa="topbar">
      <a href="/" class="logo">Cube</a>
      <nav aria-label="Primary">
        <a href="/queries">Queries</a>
        <a href="/semantic-layer">Semantic Layer</a>
      </nav>
    </header>

    <main class="app" data-theme="light">
      <section class="card" id="welcome">
        <h1>Welcome</h1>
        <p>Explore your metrics and run ad-hoc queries.</p>
        <!-- Host-rendered content -->
        <button type="button" id="run-query" disabled>Loading…</button>
      </section>

      <section class="card" id="results" hidden>
        <h2>Results</h2>
        <pre id="output"></pre>
      </section>
    </main>

    <script>
      const button = document.getElementById('run-query');
      const results = document.getElementById('results');
      const output = document.getElementById('output');

      button.disabled = false;
      button.textContent = 'Run query';

      button.addEventListener('click', async () => {
        button.disabled = true;
        results.hidden = false;
        output.textContent = 'Loading…';

        const response = await fetch('/api/v1/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: { measures: ['Orders.count'] },
          }),
        });

        const data = await response.json();
        output.textContent = JSON.stringify(data, null, 2);
        button.disabled = false;
      });
    </script>
  </body>
</html>`,
};

export const DAX = Template.bind({});
DAX.args = {
  language: 'javascript',
  height: 'max 30x',
  code: 'DEFINE\r\n\tVAR __DS0FilterTable = \r\n\t\tTREATAS({"Computers",\r\n\t\t\t"Electronics",\r\n\t\t\t"Home"}, \'orders\'[product_category])\r\n\r\n\tVAR __DS0Core = \r\n\t\tSUMMARIZECOLUMNS(\r\n\t\t\tROLLUPADDISSUBTOTAL(\'orders\'[product_category], "IsGrandTotalRowTotal"),\r\n\t\t\t__DS0FilterTable,\r\n\t\t\t"revenue", \'orders\'[revenue],\r\n\t\t\t"count", \'orders\'[count],\r\n\t\t\t"completed_count", \'orders\'[completed_count],\r\n\t\t\t"completed_percentage", \'orders\'[completed_percentage]\r\n\t\t)\r\n\r\n\tVAR __DS0PrimaryWindowed = \r\n\t\tTOPN(502, __DS0Core, [IsGrandTotalRowTotal], 0, [revenue], 0, \'orders\'[product_category], 1)\r\n\r\nEVALUATE\r\n\t__DS0PrimaryWindowed\r\n\r\nORDER BY\r\n\t[IsGrandTotalRowTotal] DESC, [revenue] DESC, \'orders\'[product_category]',
};

export const Complex = Template.bind({});
Complex.args = {
  language: 'javascript',
  height: 'max 30x',
  hideText: 'SELECT * FROM public.line_items',
  actions: <CopySnippet.Button icon={<IconSettings />} />,
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
