import { z } from 'zod';
import * as klaviyoClient from '../klaviyo-client.js';
import {
  VALID_CAMPAIGN_STATISTICS,
  DEFAULT_STATISTICS,
  API_CONFIG,
  FILTER_TEMPLATES
} from '../config.js';
import logger from '../utils/logger.js';

export function registerReportingTools(server) {
  // Get campaign values (metrics)
  server.tool(
    "get_campaign_metrics",
    {
      id: z.string().describe("ID of the campaign to retrieve metrics for"),
      metrics: z.array(z.string()).optional().describe("Specific metrics to retrieve (e.g., ['open_rate', 'click_rate', 'delivered', 'bounce_rate'])"),
      start_date: z.string().optional().describe("Start date for metrics (ISO format)"),
      end_date: z.string().optional().describe("End date for metrics (ISO format)"),
      conversion_metric_id: z.string().optional().describe("ID of the metric to use for conversion statistics")
    },
    async (params) => {
      try {
        logger.info(`Retrieving campaign metrics for campaign ID: ${params.id}`);

        // Prepare statistics list with valid names
        const statistics = params.metrics || DEFAULT_STATISTICS.standard;

        // Validate statistics to ensure they're supported by the API
        const validatedStatistics = statistics.filter(stat => VALID_CAMPAIGN_STATISTICS.includes(stat));

        if (validatedStatistics.length === 0) {
          logger.warn(`No valid statistics provided for campaign metrics. Using default: ${DEFAULT_STATISTICS.basic}`);
          validatedStatistics.push(...DEFAULT_STATISTICS.basic);
        }

        // Create payload for the reporting API
        const payload = {
          data: {
            type: "campaign-values-report",
            attributes: {
              statistics: validatedStatistics,
              filter: FILTER_TEMPLATES.campaignId(params.id),
              conversion_metric_id: params.conversion_metric_id || API_CONFIG.defaultConversionMetricId
            }
          }
        };

        // Add timeframe - either predefined or custom dates
        if (params.start_date && params.end_date) {
          payload.data.attributes.timeframe = {
            start: params.start_date,
            end: params.end_date
          };
          logger.debug(`Using custom timeframe: ${params.start_date} to ${params.end_date}`);
        } else {
          // Default to last 30 days
          payload.data.attributes.timeframe = {
            key: API_CONFIG.defaultTimeframe
          };
          logger.debug(`Using default timeframe: ${API_CONFIG.defaultTimeframe}`);
        }

        logger.debug('Campaign metrics request payload', payload);

        const results = await klaviyoClient.post('/campaign-values-reports/', payload);

        logger.info(`Successfully retrieved campaign metrics for campaign ID: ${params.id}`);

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      } catch (error) {
        // Implement fallback mechanism for error recovery
        logger.warn(`Error retrieving campaign metrics with initial parameters: ${error.message}. Attempting fallback.`);

        try {
          // Fallback to minimal statistics set
          const fallbackPayload = {
            data: {
              type: "campaign-values-report",
              attributes: {
                statistics: DEFAULT_STATISTICS.basic,
                timeframe: {
                  key: API_CONFIG.defaultTimeframe
                },
                conversion_metric_id: API_CONFIG.defaultConversionMetricId,
                filter: FILTER_TEMPLATES.campaignId(params.id)
              }
            }
          };

          logger.debug('Campaign metrics fallback payload', fallbackPayload);

          const fallbackResults = await klaviyoClient.post('/campaign-values-reports/', fallbackPayload);

          logger.info(`Successfully retrieved basic campaign metrics for campaign ID: ${params.id} using fallback`);

          return {
            content: [
              { type: "text", text: "Note: Used fallback approach with minimal statistics." },
              { type: "text", text: JSON.stringify(fallbackResults, null, 2) }
            ]
          };
        } catch (fallbackError) {
          logger.error(`Failed to retrieve campaign metrics (including fallback attempt): ${error.message}`, {
            originalError: error.message,
            fallbackError: fallbackError.message,
            campaignId: params.id
          });

          return {
            content: [{ type: "text", text: `Error retrieving campaign metrics (including fallback attempt): ${error.message}` }],
            isError: true
          };
        }
      }
    },
    { description: "Get performance metrics for a specific campaign (open rates, click rates, etc.)" }
  );

  // Query metric aggregates for custom analytics
  server.tool(
    "query_metric_aggregates",
    {
      metric_id: z.string().describe("ID of the metric to aggregate"),
      measurement: z.string().describe("Measurement to use (e.g., count, sum, unique)"),
      timeframe: z.string().describe("Timeframe to use (e.g., last_30_days, this_month)"),
      group_by: z.array(z.string()).optional().describe("Dimensions to group by"),
      start_date: z.string().optional().describe("Custom start date (ISO format, overrides timeframe)"),
      end_date: z.string().optional().describe("Custom end date (ISO format, overrides timeframe)")
    },
    async (params) => {
      try {
        logger.info(`Querying metric aggregates for metric ID: ${params.metric_id}`);

        // Validate measurement
        if (!VALID_MEASUREMENTS.includes(params.measurement)) {
          logger.warn(`Invalid measurement: ${params.measurement}. Using 'count' instead.`);
          params.measurement = 'count';
        }

        // Create payload
        const payload = {
          data: {
            type: "metric-aggregate",
            attributes: {
              metric_id: params.metric_id,
              measurements: [params.measurement],
              interval: "day",
              filter: [],
              timezone: "UTC"
            }
          }
        };

        // Use custom dates if provided, otherwise use timeframe parameter
        if (params.start_date && params.end_date) {
          // Use custom date range
          const startDateStr = params.start_date.split('T')[0];
          const endDateStr = params.end_date.split('T')[0];

          const dateFilters = FILTER_TEMPLATES.dateRange(
            `${startDateStr}T00:00:00`,
            `${endDateStr}T23:59:59`
          );

          payload.data.attributes.filter.push(...dateFilters);
          logger.debug(`Using custom date range: ${startDateStr} to ${endDateStr}`);
        } else if (TIMEFRAME_OPTIONS[params.timeframe]) {
          // Use predefined timeframe if valid
          if (params.timeframe === "last_30_days") {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const dateFilters = FILTER_TEMPLATES.dateRange(
              `${startDateStr}T00:00:00`,
              `${endDateStr}T23:59:59`
            );

            payload.data.attributes.filter.push(...dateFilters);
            logger.debug(`Using timeframe: ${params.timeframe} (${startDateStr} to ${endDateStr})`);
          } else if (params.timeframe === "this_month") {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

            const startDateStr = firstDay.toISOString().split('T')[0];
            const endDateStr = now.toISOString().split('T')[0];

            const dateFilters = FILTER_TEMPLATES.dateRange(
              `${startDateStr}T00:00:00`,
              `${endDateStr}T23:59:59`
            );

            payload.data.attributes.filter.push(...dateFilters);
            logger.debug(`Using timeframe: ${params.timeframe} (${startDateStr} to ${endDateStr})`);
          } else {
            logger.debug(`Using predefined timeframe: ${params.timeframe}`);
            payload.data.attributes.timeframe = {
              key: params.timeframe
            };
          }
        } else {
          // Default to last 7 days if timeframe is not recognized
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);

          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];

          const dateFilters = FILTER_TEMPLATES.dateRange(
            `${startDateStr}T00:00:00`,
            `${endDateStr}T23:59:59`
          );

          payload.data.attributes.filter.push(...dateFilters);
          logger.debug(`Using default 7-day range: ${startDateStr} to ${endDateStr}`);
        }

        if (params.group_by) {
          payload.data.attributes.by = params.group_by;
          logger.debug(`Grouping by: ${params.group_by.join(', ')}`);
        }

        logger.debug('Metric aggregates request payload', payload);

        // Ensure endpoint has trailing slash for consistency
        const results = await klaviyoClient.post('/metric-aggregates/', payload);

        logger.info(`Successfully retrieved metric aggregates for metric ID: ${params.metric_id}`);

        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
        };
      } catch (error) {
        // Implement fallback mechanism for error recovery
        logger.warn(`Error querying metric aggregates: ${error.message}. Attempting fallback.`);

        try {
          // Simplified fallback payload with minimal parameters
          const fallbackPayload = {
            data: {
              type: "metric-aggregate",
              attributes: {
                metric_id: params.metric_id,
                measurements: ["count"], // Default to count measurement
                interval: "day",
                filter: [],
                timezone: "UTC"
              }
            }
          };

          // Use a default time range for the fallback (last 7 days)
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);

          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];

          const dateFilters = FILTER_TEMPLATES.dateRange(
            `${startDateStr}T00:00:00`,
            `${endDateStr}T23:59:59`
          );

          fallbackPayload.data.attributes.filter.push(...dateFilters);

          logger.debug('Metric aggregates fallback payload', fallbackPayload);

          const fallbackResults = await klaviyoClient.post('/metric-aggregates/', fallbackPayload);

          logger.info(`Successfully retrieved basic metric aggregates for metric ID: ${params.metric_id} using fallback`);

          return {
            content: [
              { type: "text", text: "Note: Used fallback approach with simplified parameters." },
              { type: "text", text: JSON.stringify(fallbackResults, null, 2) }
            ]
          };
        } catch (fallbackError) {
          logger.error(`Failed to query metric aggregates (including fallback attempt): ${error.message}`, {
            originalError: error.message,
            fallbackError: fallbackError.message,
            metricId: params.metric_id
          });

          return {
            content: [{ type: "text", text: `Error querying metric aggregates (including fallback attempt): ${error.message}` }],
            isError: true
          };
        }
      }
    },
    { description: "Query aggregated metric data for custom analytics reporting" }
  );

  // Get campaign performance summary
  server.tool(
    "get_campaign_performance",
    {
      id: z.string().describe("ID of the campaign to retrieve performance for")
    },
    async (params) => {
      try {
        logger.info(`Retrieving campaign performance for campaign ID: ${params.id}`);

        // First get the campaign details
        const campaign = await klaviyoClient.get(`/campaigns/${params.id}/`);
        logger.debug(`Retrieved campaign details for ID: ${params.id}`);

        // Then get the campaign message to access the metrics
        if (!campaign.data.relationships['campaign-messages']?.data?.length) {
          logger.warn(`No campaign messages found for campaign ID: ${params.id}`);
          throw new Error(`No campaign messages found for campaign ID: ${params.id}`);
        }

        const messageId = campaign.data.relationships['campaign-messages'].data[0].id;
        const message = await klaviyoClient.get(`/campaign-messages/${messageId}/`);
        logger.debug(`Retrieved campaign message details for message ID: ${messageId}`);

        // Get campaign metrics using the updated Reporting API with valid statistics
        const payload = {
          data: {
            type: "campaign-values-report",
            attributes: {
              statistics: DEFAULT_STATISTICS.comprehensive,
              timeframe: {
                key: "all_time"  // Get all-time performance
              },
              conversion_metric_id: API_CONFIG.defaultConversionMetricId,
              filter: FILTER_TEMPLATES.campaignId(params.id)
            }
          }
        };

        logger.debug('Campaign performance request payload', payload);

        const metrics = await klaviyoClient.post('/campaign-values-reports/', payload);

        // Format the results for easier consumption
        const performance = {
          campaign_name: campaign.data.attributes.name,
          send_time: campaign.data.attributes.send_time,
          metrics: metrics.data.attributes
        };

        logger.info(`Successfully retrieved campaign performance for campaign ID: ${params.id}`);

        return {
          content: [{ type: "text", text: JSON.stringify(performance, null, 2) }]
        };
      } catch (error) {
        // Implement fallback mechanism for error recovery
        logger.warn(`Error retrieving campaign performance: ${error.message}. Attempting fallback.`);

        try {
          // First get the campaign details (retry)
          const campaign = await klaviyoClient.get(`/campaigns/${params.id}/`);

          // Fallback to minimal statistics set
          const fallbackPayload = {
            data: {
              type: "campaign-values-report",
              attributes: {
                statistics: DEFAULT_STATISTICS.basic,
                timeframe: {
                  key: "all_time"
                },
                conversion_metric_id: API_CONFIG.defaultConversionMetricId,
                filter: FILTER_TEMPLATES.campaignId(params.id)
              }
            }
          };

          logger.debug('Campaign performance fallback payload', fallbackPayload);

          const fallbackMetrics = await klaviyoClient.post('/campaign-values-reports/', fallbackPayload);

          // Format the results for easier consumption
          const performance = {
            campaign_name: campaign.data.attributes.name,
            send_time: campaign.data.attributes.send_time,
            metrics: fallbackMetrics.data.attributes,
            note: "Limited metrics available due to API constraints"
          };

          logger.info(`Successfully retrieved basic campaign performance for campaign ID: ${params.id} using fallback`);

          return {
            content: [
              { type: "text", text: "Note: Used fallback approach with minimal statistics." },
              { type: "text", text: JSON.stringify(performance, null, 2) }
            ]
          };
        } catch (fallbackError) {
          logger.error(`Failed to retrieve campaign performance (including fallback attempt): ${error.message}`, {
            originalError: error.message,
            fallbackError: fallbackError.message,
            campaignId: params.id
          });

          return {
            content: [{ type: "text", text: `Error retrieving campaign performance (including fallback attempt): ${error.message}` }],
            isError: true
          };
        }
      }
    },
    { description: "Get a comprehensive performance summary for a campaign" }
  );
}
