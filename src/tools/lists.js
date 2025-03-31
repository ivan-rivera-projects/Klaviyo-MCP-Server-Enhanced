import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerListTools(server) {
      // Get lists
      server.tool(
        "get_lists",
        {
          filter: z.string().optional().describe("Filter query for lists"),
          page_size: z.number().min(1).max(100).optional().describe("Number of lists per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const lists = await klaviyoClient.get('/lists/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(lists, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving lists: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get lists from Klaviyo" }
      );

      // Get list
      server.tool(
        "get_list",
        {
          id: z.string().describe("ID of the list to retrieve")
        },
        async (params) => {
          try {
            const list = await klaviyoClient.get(`/lists/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving list: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific list from Klaviyo" }
      );

      // Create list
      server.tool(
        "create_list",
        {
          name: z.string().describe("Name of the list"),
          list_type: z.enum(["list", "segment"]).describe("Type of list (list or segment)")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: "list",
                attributes: {
                  name: params.name,
                  list_type: params.list_type
                }
              }
            };
            
            const result = await klaviyoClient.post('/lists/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating list: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Create a new list in Klaviyo" }
      );

      // Add profiles to list
      server.tool(
        "add_profiles_to_list",
        {
          list_id: z.string().describe("ID of the list"),
          profile_ids: z.array(z.string()).describe("Array of profile IDs to add to the list")
        },
        async (params) => {
          try {
            const payload = {
              data: params.profile_ids.map(id => ({
                type: "profile",
                id
              }))
            };
            
            await klaviyoClient.post(`/lists/${params.list_id}/relationships/profiles/`, payload);
            return {
              content: [{ type: "text", text: "Profiles added to list successfully" }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error adding profiles to list: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Add profiles to a list in Klaviyo" }
      );
    }
