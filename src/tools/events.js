import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerEventTools(server) {
      // Get events
      server.tool(
        "get_events",
        {
          filter: z.string().optional().describe("Filter query for events"),
          page_size: z.number().min(1).max(100).optional().describe("Number of events per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const events = await klaviyoClient.get('/events/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(events, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving events: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get events from Klaviyo" }
      );

      // Create event
      server.tool(
        "create_event",
        {
          metric: z.object({
            name: z.string().describe("Name of the metric")
          }).describe("Metric information for the event"),
          profile: z.object({
            email: z.string().email().describe("Email of the customer")
          }).describe("Profile information for the event"),
          properties: z.record(z.any()).optional().describe("Additional properties for the event"),
          time: z.string().optional().describe("ISO timestamp for the event"),
          value: z.number().optional().describe("Numeric value for the event")
        },
        async (params) => {
          try {
            // Format payload according to the latest API structure
            const payload = {
              data: {
                type: "event",
                attributes: {
                  metric: params.metric,
                  profile: params.profile,
                  properties: params.properties || {},
                  time: params.time || new Date().toISOString(),
                  value: params.value !== undefined ? params.value : 0
                }
              }
            };
            
            const result = await klaviyoClient.post('/events/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating event: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Create a new event in Klaviyo" }
      );
    }
