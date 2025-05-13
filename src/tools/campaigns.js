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

      // Get campaign message
      server.tool(
        "get_campaign_message",
        {
          id: z.string().describe("ID of the campaign message to retrieve")
        },
        async (params) => {
          try {
            const message = await klaviyoClient.get(`/campaign-messages/${params.id}/`, {
              include: "template"
            });
            return {
              content: [{ type: "text", text: JSON.stringify(message, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving campaign message: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific campaign message including template details" }
      );

      // Get campaign messages
      server.tool(
        "get_campaign_messages",
        {
          campaign_id: z.string().describe("ID of the campaign to retrieve messages for")
        },
        async (params) => {
          try {
            const messages = await klaviyoClient.get(`/campaigns/${params.campaign_id}/campaign-messages/`);
            return {
              content: [{ type: "text", text: JSON.stringify(messages, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving campaign messages: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get all messages for a specific campaign" }
      );

      // Get campaign recipient estimation
      server.tool(
        "get_campaign_recipient_estimation",
        {
          id: z.string().describe("ID of the campaign to retrieve recipient estimations for")
        },
        async (params) => {
          try {
            const estimation = await klaviyoClient.get(`/campaign-recipient-estimations/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(estimation, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving campaign recipient estimation: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get estimated recipient count for a campaign" }
      );
    }
