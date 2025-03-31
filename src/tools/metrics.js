import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerMetricTools(server) {
      // Get metrics
      server.tool(
        "get_metrics",
        {
          filter: z.string().optional().describe("Filter query for metrics"),
          page_size: z.number().min(1).max(100).optional().describe("Number of metrics per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const metrics = await klaviyoClient.get('/metrics/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving metrics: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get metrics from Klaviyo" }
      );

      // Get metric
      server.tool(
        "get_metric",
        {
          id: z.string().describe("ID of the metric to retrieve")
        },
        async (params) => {
          try {
            const metric = await klaviyoClient.get(`/metrics/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(metric, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving metric: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific metric from Klaviyo" }
      );
    }
