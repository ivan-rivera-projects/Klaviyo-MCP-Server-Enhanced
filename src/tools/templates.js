import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerTemplateTools(server) {
      // Get templates
      server.tool(
        "get_templates",
        {
          filter: z.string().optional().describe("Filter query for templates"),
          page_size: z.number().min(1).max(100).optional().describe("Number of templates per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const templates = await klaviyoClient.get('/templates/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(templates, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving templates: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get templates from Klaviyo" }
      );

      // Get template
      server.tool(
        "get_template",
        {
          id: z.string().describe("ID of the template to retrieve")
        },
        async (params) => {
          try {
            const template = await klaviyoClient.get(`/templates/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(template, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving template: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific template from Klaviyo" }
      );

      // Create template
      server.tool(
        "create_template",
        {
          name: z.string().describe("Name of the template"),
          html: z.string().describe("HTML content of the template"),
          text: z.string().optional().describe("Text content of the template")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: "template",
                attributes: {
                  name: params.name,
                  html: params.html,
                  text: params.text
                }
              }
            };
            
            const result = await klaviyoClient.post('/templates/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating template: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Create a new template in Klaviyo" }
      );
    }
