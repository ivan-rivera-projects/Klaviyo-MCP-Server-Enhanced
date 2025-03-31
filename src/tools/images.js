import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerImageTools(server) {
      // Get images
      server.tool(
        "get_images",
        {
          filter: z.string().optional().describe("Filter query for images"),
          page_size: z.number().min(1).max(100).optional().describe("Number of images per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const images = await klaviyoClient.get('/images/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(images, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving images: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get images from Klaviyo" }
      );

      // Get image
      server.tool(
        "get_image",
        {
          id: z.string().describe("ID of the image to retrieve")
        },
        async (params) => {
          try {
            const image = await klaviyoClient.get(`/images/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(image, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving image: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific image from Klaviyo" }
      );
    }
