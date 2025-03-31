import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerFormTools(server) {
      // Get forms
      server.tool(
        "get_forms",
        {
          filter: z.string().optional().describe("Filter query for forms"),
          page_size: z.number().min(1).max(100).optional().describe("Number of forms per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const forms = await klaviyoClient.get('/forms/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(forms, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving forms: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get forms from Klaviyo" }
      );

      // Get form
      server.tool(
        "get_form",
        {
          id: z.string().describe("ID of the form to retrieve")
        },
        async (params) => {
          try {
            const form = await klaviyoClient.get(`/forms/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(form, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving form: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific form from Klaviyo" }
      );
    }
