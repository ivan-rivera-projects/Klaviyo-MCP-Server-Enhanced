import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerReviewTools(server) {
      // Get product reviews
      server.tool(
        "get_product_reviews",
        {
          filter: z.string().optional().describe("Filter query for product reviews"),
          page_size: z.number().min(1).max(100).optional().describe("Number of reviews per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const reviews = await klaviyoClient.get('/product-reviews/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(reviews, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving product reviews: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get product reviews from Klaviyo" }
      );

      // Get product review
      server.tool(
        "get_product_review",
        {
          id: z.string().describe("ID of the product review to retrieve")
        },
        async (params) => {
          try {
            const review = await klaviyoClient.get(`/product-reviews/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(review, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving product review: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific product review from Klaviyo" }
      );
    }
