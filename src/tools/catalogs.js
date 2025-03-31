import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerCatalogTools(server) {
      // Get catalogs
      server.tool(
        "get_catalogs",
        {
          page_size: z.number().min(1).max(100).optional().describe("Number of catalogs per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const catalogs = await klaviyoClient.get('/catalogs/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(catalogs, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving catalogs: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get catalogs from Klaviyo" }
      );

      // Get catalog items
      server.tool(
        "get_catalog_items",
        {
          catalog_id: z.string().describe("ID of the catalog"),
          filter: z.string().optional().describe("Filter query for catalog items"),
          page_size: z.number().min(1).max(100).optional().describe("Number of items per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const { catalog_id, ...queryParams } = params;
            const items = await klaviyoClient.get(`/catalogs/${catalog_id}/items/`, queryParams);
            return {
              content: [{ type: "text", text: JSON.stringify(items, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving catalog items: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get items from a catalog in Klaviyo" }
      );

      // Get catalog item
      server.tool(
        "get_catalog_item",
        {
          catalog_id: z.string().describe("ID of the catalog"),
          item_id: z.string().describe("ID of the catalog item")
        },
        async (params) => {
          try {
            const item = await klaviyoClient.get(`/catalogs/${params.catalog_id}/items/${params.item_id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(item, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving catalog item: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific item from a catalog in Klaviyo" }
      );
    }
