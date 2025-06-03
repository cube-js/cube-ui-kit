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

const Template = ({ ...args }) => <PrismCode {...args} />;

export const OneLine = Template.bind({});
OneLine.args = {
  language: 'bash',
  code: '$ npm install -g cubejs-cli',
};

export const MultiLine = Template.bind({});
MultiLine.args = {
  language: 'bash',
  code: '$ npm install -g cubejs-cli\n$ cubejs deploy',
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

export const YamlSyntax = Template.bind({});
YamlSyntax.args = {
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
};

export const SqlSyntax = Template.bind({});
SqlSyntax.args = {
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
};

export const DiffSyntax = Template.bind({});
DiffSyntax.args = {
  language: 'javascript',
  code: `  console.log('Hello, world!');
+ console.log('This line was added!');
  console.log('Another unchanged line');
- console.log('This line was removed.');`,
};
