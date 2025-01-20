import { baseProps } from '../../../stories/lists/baseProps';

import { PrismDiffCode } from './PrismDiffCode';

export default {
  title: 'Content/PrismDiffCode',
  component: PrismDiffCode,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ ...args }) => <PrismDiffCode {...args} />;

// export const JavascriptSyntax = Template.bind({});
// JavascriptSyntax.args = {
//   language: 'javascript',
//   code: ``,
// };

export const YamlSyntax = Template.bind({});
YamlSyntax.args = {
  language: 'yaml',
  original: `cubes:
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
  modified: `cubes:
  # Define the Orders cube
  - name: Orders
    sql: SELECT * FROM public.orders

    # Measures (metrics to analyze)
    measures:
      - name: orderCount
        type: count # Total number of orders
      - name: totalRevenue
        sql: total_amount
        type: sum # Total revenue from orders
      - name: averageOrderValue
        sql: total_amount
        type: avg # Average value of orders

    # Dimensions (categorical or time-based data)
    dimensions:
      - name: id
        sql: id
        type: number # Unique order ID
      - name: status
        sql: status
        type: string # Order status (e.g., completed, pending, canceled)
      - name: created_date
        sql: created_at
        type: time # Date when the order was created

    # Pre-aggregation for performance optimization
    preAggregations:
      weeklyRevenue:
        type: rollup
        measures: [totalRevenue] # Aggregate total revenue
        timeDimension: created_at
        granularity: week # Weekly rollups

  # Define the Customers cube
  - name: Customers
    sql: SELECT * FROM public.customers

    # Measures
    measures:
      - name: customerCount
        type: countDistinct
        sql: id # Count distinct customers

    # Dimensions
    dimensions:
      - name: id
        sql: id
        type: number # Customer ID
      - name: fullName
        sql: name
        type: string # Full name of the customer
      - name: signupDate
        sql: created_at
        type: time # Date when the customer signed up

    # Join with the Orders cube
    joins:
      - cube: Orders
        sql: \${Customers.id} = \${Orders.customer_id}
        relationship: one_to_many # One customer can have multiple orders`,
};

export const SqlSyntax = Template.bind({});
SqlSyntax.args = {
  language: 'sql',
  original: `WITH RecursiveCTE AS (
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
  modified: `WITH RecursiveDates AS (
    -- Generate a sequence of dates starting from 2025-01-01
    SELECT 1 AS DayNumber, CAST('2025-01-01' AS DATE) AS GeneratedDate
    UNION ALL
    SELECT DayNumber + 1, DATEADD(DAY, 1, GeneratedDate)
    FROM RecursiveDates
    WHERE DayNumber < 15
),
OrderStatistics AS (
    -- Aggregate orders by user, including completed orders only
    SELECT
        u.UserID,
        u.UserName,
        COUNT(o.OrderID) AS OrderCount,
        SUM(o.TotalAmount) AS TotalRevenue,
        AVG(o.TotalAmount) AS AverageOrderValue,
        MAX(o.OrderDate) AS LatestOrderDate
    FROM Users u
    INNER JOIN Orders o ON u.UserID = o.UserID
    WHERE o.Status = 'completed' AND o.OrderDate > '2024-01-01'
    GROUP BY u.UserID, u.UserName
),
FilteredData AS (
    -- Select users with at least 5 completed orders
    SELECT *
    FROM OrderStatistics
    WHERE OrderCount >= 5
),
FinalOutput AS (
    -- Combine user statistics with generated dates for reporting
    SELECT
        f.UserID,
        f.UserName,
        f.OrderCount,
        f.TotalRevenue,
        f.AverageOrderValue,
        r.GeneratedDate
    FROM FilteredData f
    CROSS JOIN RecursiveDates r
    WHERE r.GeneratedDate <= GETDATE()
)
-- Output the final result ordered by date and user ID
SELECT
    fo.UserID,
    fo.UserName,
    fo.OrderCount,
    fo.TotalRevenue,
    fo.AverageOrderValue,
    fo.GeneratedDate
FROM FinalOutput fo
ORDER BY fo.GeneratedDate, fo.UserID;`,
};

export const EmptyLineDiff = Template.bind({});
EmptyLineDiff.args = {
  modified:
    "cubes:\n  - name: orders\n    sql: >\n      select 1 as id, 100 as amount, 'new' status\n      UNION ALL\n      select 2 as id, 200 as amount, 'new' status\n      UNION ALL\n      select 3 as id, 300 as amount, 'processed' status\n      UNION ALL\n      select 4 as id, 500 as amount, 'processed' status\n      UNION ALL\n      select 5 as id, 600 as amount, 'shipped' status\n\n    joins: []\n\n    dimensions:\n      - name: id\n        type: number\n\n      - name: status\n        sql: status\n\n\n    measures:\n      - name: count\n        type: count\n\n      - name: amount\n        sql: amount\n        type: sum\n\n    pre_aggregations:\n      # Pre-aggregation definitions go here.\n      # Learn more in the documentation: https://cube.dev/docs/caching/pre-aggregations/getting-started\n\n",
  original:
    "cubes:\n  - name: orders\n    sql: >\n      select 1 as id, 100 as amount, 'new' status\n      UNION ALL\n      select 2 as id, 200 as amount, 'new' status\n      UNION ALL\n      select 3 as id, 300 as amount, 'processed' status\n      UNION ALL\n      select 4 as id, 500 as amount, 'processed' status\n      UNION ALL\n      select 5 as id, 600 as amount, 'shipped' status\n\n    joins: []\n\n    dimensions:\n      - name: id\n\n      - name: status\n        sql: status\n\n\n    measures:\n      - name: count\n        type: count\n\n      - name: amount\n        sql: amount\n        type: sum\n\n    pre_aggregations:\n      # Pre-aggregation definitions go here.\n      # Learn more in the documentation: https://cube.dev/docs/caching/pre-aggregations/getting-started\n\n",
  language: 'yaml',
};
