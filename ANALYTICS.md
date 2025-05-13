# Klaviyo MCP Server - Analytics Enhancement

This document outlines the enhancements made to the Klaviyo MCP Server to support analytics and reporting functionalities.

## Overview

Klaviyo MCP Server now includes additional tools for retrieving campaign performance metrics, aggregated metrics data, and detailed campaign message information. These enhancements enable access to valuable analytics data such as open rates, click-through rates, and conversion metrics that were previously unavailable through the MCP.

## Recent Updates (2024)

The analytics functionality has been updated to align with the latest Klaviyo API requirements:

1. **Updated API Revision Date**: Now using `2024-06-15` for all API calls
2. **Corrected Statistics Values**: Updated to use the correct statistics values supported by the API (removed unsupported statistics like `spam_rate`)
3. **Improved Filter Format**: Updated campaign filter format to use the correct syntax
4. **Enhanced Error Handling**: Added fallback mechanisms for more robust error recovery
5. **Fixed JSON Parsing Issues**: Resolved JSON parsing warnings in Claude Desktop
6. **Improved URL Parameter Handling**: Enhanced URL parameter formatting for API requests
7. **Added Documentation**: Created comprehensive API reference documentation

### Major Improvements

1. **Centralized Configuration**
   - Created a central configuration file (`src/config.js`) for all API parameters
   - Made API revision date, valid statistics, and other parameters easily configurable
   - Prevented inconsistencies across different files when API parameters change

2. **Enhanced Logging**
   - Implemented a robust logging system (`src/utils/logger.js`)
   - Added structured logging with different log levels (debug, info, warn, error)
   - Added specialized logging for API requests and responses
   - Masked sensitive data in logs for security

3. **Rate Limiting Handling**
   - Added retry logic for rate limit errors
   - Implemented exponential backoff with jitter for retries
   - Added clear feedback when rate limits are encountered

4. **Caching**
   - Implemented in-memory caching for frequently accessed data
   - Added cache invalidation based on TTL (time-to-live)
   - Optimized cache for different data types (metrics, campaigns, etc.)
   - Added cache statistics for monitoring

## New Capabilities

### 1. Campaign Analytics

The MCP now supports retrieving detailed campaign performance metrics including:
- Open rates and unique opens
- Click rates and unique clicks
- Conversion rates
- Revenue attribution
- Unsubscribe rates
- Send volumes

### 2. Metric Aggregates

Custom analytics reporting is now possible through:
- Aggregation of metric data across different time periods
- Support for various measurements (count, sum, unique)
- Dimensional grouping for more detailed analysis

### 3. Campaign Messages

Detailed access to campaign messages including:
- Message content and template information
- Recipient estimations
- Performance metrics per message

## New Tools

### Reporting Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_campaign_metrics` | Retrieves performance metrics for a specific campaign | `id`, `metrics`, `start_date`, `end_date` |
| `query_metric_aggregates` | Queries aggregated metric data for custom reporting | `metric_id`, `measurement`, `timeframe`, `group_by` |
| `get_campaign_performance` | Gets a comprehensive performance summary for a campaign | `id` |

### Campaign Tools (Enhanced)

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_campaign_message` | Retrieves a specific campaign message with template details | `id` |
| `get_campaign_messages` | Gets all messages for a specific campaign | `campaign_id` |
| `get_campaign_recipient_estimation` | Gets estimated recipient count for a campaign | `id` |

## Usage Examples

### Getting Campaign Performance Metrics

```javascript
// Retrieve open rates and click rates for a campaign
get_campaign_metrics({
    id: "01JSQRND0PMH88186NREAJEGGN",
    metrics: ["open_rate", "click_rate", "delivered", "bounce_rate"],
    conversion_metric_id: "VevE7N", // Placed Order metric ID
    start_date: "2025-04-01T00:00:00Z", // Optional: Custom date range
    end_date: "2025-05-01T00:00:00Z"    // Optional: Custom date range
})
```

### Querying Aggregated Metrics

```javascript
// Count placed orders grouped by month
query_metric_aggregates({
    metric_id: "VevE7N", // Placed Order metric ID
    measurement: "count",
    group_by: ["month"],
    timeframe: "last_30_days", // Predefined timeframe
    // Or use custom dates:
    start_date: "2025-01-01T00:00:00Z",
    end_date: "2025-05-01T00:00:00Z"
})
```

### Getting Campaign Performance Summary

```javascript
// Get a comprehensive summary of campaign performance
get_campaign_performance({
    id: "01JSQRND0PMH88186NREAJEGGN"
})
```

## Testing Guidelines

To test the new functionality:

1. Start the Klaviyo MCP Server:
   ```
   cd /Users/ivanrivera/Downloads/AWS/Klaviyo-MCP-Server
   KLAVIYO_API_KEY=your_private_api_key npm run dev
   ```

2. Test reporting tools:
   - Use `get_campaign_metrics` with a valid campaign ID
   - Check that open rates, click rates, and other metrics are returned
   - Verify data matches what's shown in the Klaviyo dashboard

3. Test campaign message tools:
   - Use `get_campaign_message` with a valid message ID
   - Use `get_campaign_messages` with a valid campaign ID
   - Check that the response includes template information

4. Test metric aggregation:
   - Use `query_metric_aggregates` with a valid metric ID
   - Try different measurements and time frames
   - Verify the aggregated data is accurate

## API Key Requirements

To use these enhanced analytics features, your Klaviyo API key must have the following scopes:
- `campaigns:read`
- `metrics:read`
- `flows:read` (if querying flow data)

## API Version Requirements

The Klaviyo MCP Server uses the Klaviyo API Revision `2024-06-15`. Earlier API versions may not support all features. The specific endpoints and structures are:

- Campaign metrics: `/campaign-values-reports/` with required fields:
  - `statistics`: Array of valid statistics to retrieve (see below)
  - `timeframe`: Object with either `key` (predefined timeframe) or `start/end` dates
  - `conversion_metric_id`: ID of metric for conversion calculations
  - `filter`: Filter string for targeting specific campaigns using format `equals(campaign_id,\"${id}\")`

- Metric aggregates: `/metric-aggregates/` with:
  - `filter`: Array of filter conditions
  - `measurements`: Array of measurement types
  - `timezone`: Timezone for date calculations (e.g., "UTC")

- Campaign performance: Combined data from multiple endpoints

Using older API versions may result in errors like "Revision date requested is before the earliest available."

### Valid Statistics Values

For campaign metrics, use these valid statistics values:
- `delivered` - Number of emails delivered
- `open_rate` - Percentage of delivered emails that were opened
- `click_rate` - Percentage of delivered emails that were clicked
- `bounce_rate` - Percentage of sent emails that bounced
- `unsubscribe_rate` - Percentage of delivered emails that resulted in unsubscribes
- `revenue_per_recipient` - Average revenue per recipient

Note: `spam_rate` is no longer supported in the latest API revision. The older statistics values like `unique_opens`, `unique_clicks`, etc. are also no longer supported.

### Error Handling and Fallbacks

The MCP Server now implements improved fallback mechanisms for error recovery:
- For campaign metrics, it falls back to a minimal set of statistics (`delivered`) if the initial request fails
- For metric aggregates, it falls back to a simplified payload with the `count` measurement and a 7-day timeframe
- For campaign performance, it provides fallbacks for both campaign details and metrics retrieval
- All tools provide more detailed error messages to help with troubleshooting

### JSON Parsing Warnings

When using the MCP server with Claude Desktop, you may occasionally see JSON parsing warnings. These are typically related to:

1. The structure of the response data from Klaviyo's API
2. How Claude processes the JSON responses

These warnings generally don't affect functionality but are documented here for reference. The enhanced error handling in the latest version helps mitigate these issues.

## Limitations

- The Klaviyo API may impose rate limits on reporting endpoints
- Some metrics may have a delay before they are available in the API
- Historical data availability may be limited based on your Klaviyo plan

## Future Enhancements

Potential future improvements (prioritized by impact/effort):

1. **Additional Analytics Features** (High impact, Medium effort)
   - Support for flow analytics
   - A/B testing result analysis
   - Predictive analytics integration
   - Custom dashboard data preparation

2. **Performance Optimization** (Medium impact, Low effort)
   - Further optimize caching strategies
   - Implement batch processing for large data sets
   - Add compression for large responses

3. **Enhanced User Interface** (Medium impact, High effort)
   - Create a web dashboard for analytics visualization
   - Add interactive charts and graphs
   - Implement custom report generation

## Contributors

This enhancement was implemented by Ivan Rivera with assistance from Claude AI.

## Additional Documentation

For more detailed information about the Klaviyo API, refer to:

1. **Klaviyo API Reference** - See `docs/KLAVIYO_API_REFERENCE.md` for detailed information about valid statistics values, filter formats, and payload structures.

2. **Official Klaviyo Documentation**:
   - [API Overview](https://developers.klaviyo.com/en/reference/api_overview)
   - [APIs Comparison Chart](https://developers.klaviyo.com/en/docs/apis_comparison_chart)
   - [SDK Overview](https://developers.klaviyo.com/en/docs/sdk_overview)

## License

Same as the original Klaviyo MCP Server.
