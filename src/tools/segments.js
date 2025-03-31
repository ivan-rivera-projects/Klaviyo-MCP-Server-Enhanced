import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerSegmentTools(server) {
      // Get segments
      server.tool(
        "get_segments",
        {
          filter: z.string().optional().describe("Filter query for segments"),
          page_size: z.number().min(1).max(100).optional().describe("Number of segments per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const segments = await klaviyoClient.get('/segments/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(segments, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving segments: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get segments from Klaviyo" }
      );

      // Get segment
      server.tool(
        "get_segment",
        {
          id: z.string().describe("ID of the segment to retrieve")
        },
        async (params) => {
          try {
            const segment = await klaviyoClient.get(`/segments/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(segment, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving segment: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific segment from Klaviyo" }
      );
    }
