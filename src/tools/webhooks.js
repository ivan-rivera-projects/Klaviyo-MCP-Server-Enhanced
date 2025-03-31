import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerWebhookTools(server) {
      // Get webhooks
      server.tool(
        "get_webhooks",
        {
          page_size: z.number().min(1).max(100).optional().describe("Number of webhooks per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const webhooks = await klaviyoClient.get('/webhooks/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(webhooks, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving webhooks: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get webhooks from Klaviyo" }
      );

      // Create webhook
      server.tool(
        "create_webhook",
        {
          endpoint: z.string().url().describe("URL endpoint for the webhook"),
          events: z.array(z.string()).describe("Events to subscribe to"),
          profile_id: z.string().optional().describe("Profile ID for authentication")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: "webhook",
                attributes: {
                  endpoint: params.endpoint,
                  events: params.events
                }
              }
            };
            
            if (params.profile_id) {
              payload.data.relationships = {
                profile: {
                  data: {
                    type: "profile",
                    id: params.profile_id
                  }
                }
              };
            }
            
            const result = await klaviyoClient.post('/webhooks/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating webhook: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Create a new webhook in Klaviyo" }
      );

      // Delete webhook
      server.tool(
        "delete_webhook",
        {
          id: z.string().describe("ID of the webhook to delete")
        },
        async (params) => {
          try {
            await klaviyoClient.del(`/webhooks/${params.id}/`);
            return {
              content: [{ type: "text", text: "Webhook deleted successfully" }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error deleting webhook: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Delete a webhook from Klaviyo" }
      );
    }
