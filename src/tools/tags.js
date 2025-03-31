import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerTagTools(server) {
      // Get tags
      server.tool(
        "get_tags",
        {
          filter: z.string().optional().describe("Filter query for tags"),
          page_size: z.number().min(1).max(100).optional().describe("Number of tags per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const tags = await klaviyoClient.get('/tags/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(tags, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving tags: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get tags from Klaviyo" }
      );

      // Create tag
      server.tool(
        "create_tag",
        {
          name: z.string().describe("Name of the tag"),
          tag_type: z.enum(["system", "custom"]).describe("Type of tag")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: "tag",
                attributes: {
                  name: params.name,
                  tag_type: params.tag_type
                }
              }
            };
            
            const result = await klaviyoClient.post('/tags/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating tag: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Create a new tag in Klaviyo" }
      );

      // Add tag to resource
      server.tool(
        "add_tag_to_resource",
        {
          tag_id: z.string().describe("ID of the tag"),
          resource_type: z.enum(["list", "segment", "flow", "campaign", "template"]).describe("Type of resource to tag"),
          resource_id: z.string().describe("ID of the resource to tag")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: params.resource_type,
                id: params.resource_id
              }
            };
            
            await klaviyoClient.post(`/tags/${params.tag_id}/relationships/${params.resource_type}s/`, payload);
            return {
              content: [{ type: "text", text: `Tag successfully added to ${params.resource_type}` }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error adding tag to resource: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Add a tag to a resource in Klaviyo" }
      );
    }
