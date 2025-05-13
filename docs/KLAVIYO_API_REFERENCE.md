# Klaviyo API Reference

This document provides reference information for working with the Klaviyo API in the MCP Server.

## API Version

The current API revision date used in this project is `2024-02-15`. This is set in the `klaviyo-client.js` file.

## Campaign Values Reports

### Valid Statistics Values

When retrieving campaign metrics using the `/campaign-values-reports/` endpoint, the following statistics values are valid:

- `delivered` - Number of emails delivered
- `open_rate` - Percentage of delivered emails that were opened
- `click_rate` - Percentage of delivered emails that were clicked
- `bounce_rate` - Percentage of sent emails that bounced
- `unsubscribe_rate` - Percentage of delivered emails that resulted in unsubscribes
- `spam_rate` - Percentage of delivered emails that were marked as spam
- `revenue_per_recipient` - Average revenue per recipient

### Filter Format

The correct filter format for campaign metrics is:

```javascript
filter: `equals(campaign_id,\"${campaignId}\")`
```

Note that the older format using `campaign_ids` as an array is no longer supported:

```javascript
// DEPRECATED
filter: `equals(campaign_ids,[\"${campaignId}\"])`
```

### Conversion Metric ID

The default conversion metric ID used for campaign metrics is `VevE7N` (Placed Order).

## Metric Aggregates

### Endpoint

The correct endpoint for metric aggregates is `/metric-aggregates/` (with trailing slash).

### Payload Structure

The correct payload structure for metric aggregates is:

```javascript
{
  data: {
    type: "metric-aggregate",
    attributes: {
      metric_id: "metricId",
      measurements: ["count"], // or other measurements
      interval: "day",
      filter: [
        "greater-or-equal(datetime,2023-01-01T00:00:00)",
        "less-than(datetime,2023-01-31T23:59:59)"
      ],
      timezone: "UTC" // Important to include
    }
  }
}
```

### Valid Measurements

The following measurements are valid for metric aggregates:

- `count` - Count of events
- `unique` - Count of unique profiles
- `sum` - Sum of a property value
- `average` - Average of a property value
- `min` - Minimum value of a property
- `max` - Maximum value of a property

## Error Handling

The MCP Server implements fallback mechanisms for error recovery:

1. For campaign metrics, it falls back to a minimal set of statistics (`delivered`) if the initial request fails.
2. For metric aggregates, it falls back to a simplified payload with the `count` measurement and a 7-day timeframe.

## API Endpoints Reference

- Campaigns: `/campaigns/`
- Campaign Messages: `/campaigns/{id}/campaign-messages/`
- Campaign Values Reports: `/campaign-values-reports/`
- Metrics: `/metrics/`
- Metric Aggregates: `/metric-aggregates/`

## Additional Resources

For more information, refer to the official Klaviyo API documentation:

- [API Overview](https://developers.klaviyo.com/en/reference/api_overview)
- [APIs Comparison Chart](https://developers.klaviyo.com/en/docs/apis_comparison_chart)
- [SDK Overview](https://developers.klaviyo.com/en/docs/sdk_overview)
