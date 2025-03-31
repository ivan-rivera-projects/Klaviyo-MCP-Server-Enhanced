import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerCampaignTools(server) {
      // Get campaigns
      server.tool(
        "get_campaigns",
        {
          filter: z.string().optional().describe("Filter query for campaigns"),
          page_size: z.number().min(1).max(100).optional().describe("Number of campaigns per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const campaigns = await klaviyoClient.get('/campaigns/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(campaigns, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving campaigns: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get campaigns from Klaviyo" }
      );

      // Get campaign
      server.tool(
        "get_campaign",
        {
          id: z.string().describe("ID of the campaign to retrieve")
        },
        async (params) => {
          try {
            const campaign = await klaviyoClient.get(`/campaigns/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(campaign, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving campaign: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific campaign from Klaviyo" }
      );
    }
