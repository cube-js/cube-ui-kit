import { baseProps } from '../../../stories/lists/baseProps';

import { PrismCode } from './PrismCode';

export default {
  title: 'Content/PrismCode',
  component: PrismCode,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = (args: any) => <PrismCode {...args} />;

export const OneLine = {
  render: Template,
  args: {
    language: 'bash',
    code: '$ npm install -g cubejs-cli',
  },
};

export const MultiLine = {
  render: Template,
  args: {
    language: 'bash',
    code: '$ npm install -g cubejs-cli\n$ cubejs deploy',
  },
};

export const Wrapped = {
  render: Template,
  args: {
    language: 'bash',
    isWrapped: true,
    width: 'max 400px',
    code: 'XMLA Internal Error: Arrow error: External error: Database Execution Error: Internal: Error during planning: Error decoding LogicalPlanNode.logical_plan_type:SubqueryAliasNode.input as protobuf message',
  },
};

export const JavascriptSyntax = {
  render: Template,
  args: {
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
  },
};

export const YamlSyntax = {
  render: Template,
  args: {
    language: 'yaml',
    code: `cubes:
  # Define the Orders cube
  - name: Orders
    sql: SELECT * FROM public.orders

    # Measures (metrics to analyze)
    measures:
      - name: count
        type: count # Total number of orders
      - name: totalRevenue
        sql: total_amount
        type: sum # Sum of all order totals

    # Dimensions (categorical or time-based data)
    dimensions:
      - name: id
        sql: id
        type: number # Unique order ID
      - name: status
        sql: status
        type: string # Order status (e.g., completed, pending)
      - name: created_at
        sql: created_at
        type: time # Order creation date

    # Pre-aggregation for performance optimization
    preAggregations:
      monthlyRevenue:
        type: rollup
        measures: [totalRevenue] # Aggregate total revenue
        dimensions: [status] # Group by order status
        timeDimension: created_at
        granularity: month # Monthly rollups

  # Define the Customers cube
  - name: Customers
    sql: SELECT * FROM public.customers

    # Measures
    measures:
      - name: totalCustomers
        type: countDistinct
        sql: id # Count distinct customer IDs

    # Dimensions
    dimensions:
      - name: id
        sql: id
        type: number # Customer ID
      - name: name
        sql: name
        type: string # Customer name

    # Join with the Orders cube
    joins:
      - cube: Orders
        sql: \${Customers.id} = \${Orders.customer_id}
        relationship: one_to_many # One customer can have many orders`,
  },
};

export const SqlSyntax = {
  render: Template,
  args: {
    language: 'sql',
    code: `WITH RecursiveCTE AS (
    -- Recursive CTE to generate a sequence of numbers
    SELECT 1 AS Level, CAST('2025-01-01' AS DATE) AS GeneratedDate
    UNION ALL
    SELECT Level + 1, DATEADD(DAY, 1, GeneratedDate)
    FROM RecursiveCTE
    WHERE Level < 10
),
AggregatedData AS (
    -- Aggregate data with window functions and filters
    SELECT
        u.UserID,
        u.UserName,
        COUNT(o.OrderID) OVER (PARTITION BY u.UserID) AS TotalOrders,
        SUM(o.TotalAmount) OVER (PARTITION BY u.UserID) AS TotalSpent,
        ROW_NUMBER() OVER (PARTITION BY u.UserID ORDER BY o.OrderDate DESC) AS LatestOrderRank
    FROM Users u
    LEFT JOIN Orders o ON u.UserID = o.UserID
    WHERE o.OrderDate > '2024-01-01'
),
FilteredData AS (
    -- Filter the aggregated data to the most recent order per user
    SELECT *
    FROM AggregatedData
    WHERE LatestOrderRank = 1
),
FinalOutput AS (
    -- Final output with additional computations
    SELECT
        f.UserID,
        f.UserName,
        f.TotalOrders,
        f.TotalSpent,
        CASE
            WHEN f.TotalSpent > 1000 THEN 'VIP'
            WHEN f.TotalSpent BETWEEN 500 AND 1000 THEN 'Regular'
            ELSE 'New'
        END AS UserCategory,
        r.GeneratedDate
    FROM FilteredData f
    CROSS JOIN RecursiveCTE r
    WHERE r.GeneratedDate <= GETDATE()
)
 -- Final query to output the results
SELECT
    fo.UserID,
    fo.UserName,
    fo.TotalOrders,
    fo.TotalSpent,
    fo.UserCategory,
    fo.GeneratedDate
FROM FinalOutput fo
ORDER BY fo.GeneratedDate, fo.UserID;`,
  },
};

export const HtmlSyntax = {
  render: Template,
  args: {
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
  },
};

export const DiffSyntax = {
  render: Template,
  args: {
    language: 'javascript',
    code: `  console.log('Hello, world!');
+ console.log('This line was added!');
  console.log('Another unchanged line');
- console.log('This line was removed.');`,
  },
};
