import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerFlowTools(server) {
      // Get flows
      server.tool(
        "get_flows",
        {
          filter: z.string().optional().describe("Filter query for flows"),
          page_size: z.number().min(1).max(100).optional().describe("Number of flows per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const flows = await klaviyoClient.get('/flows/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(flows, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving flows: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get flows from Klaviyo" }
      );

      // Get flow
      server.tool(
        "get_flow",
        {
          id: z.string().describe("ID of the flow to retrieve")
        },
        async (params) => {
          try {
            const flow = await klaviyoClient.get(`/flows/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(flow, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving flow: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific flow from Klaviyo" }
      );

      // Update flow status
      server.tool(
        "update_flow_status",
        {
          id: z.string().describe("ID of the flow to update"),
          status: z.enum(["draft", "manual", "live"]).describe("New status for the flow")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: "flow",
                id: params.id,
                attributes: {
                  status: params.status
                }
              }
            };
            
            const result = await klaviyoClient.patch(`/flows/${params.id}/`, payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error updating flow status: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Update the status of a flow in Klaviyo" }
      );
    }
