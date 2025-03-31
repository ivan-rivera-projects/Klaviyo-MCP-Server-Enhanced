import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerCouponTools(server) {
      // Get coupons
      server.tool(
        "get_coupons",
        {
          filter: z.string().optional().describe("Filter query for coupons"),
          page_size: z.number().min(1).max(100).optional().describe("Number of coupons per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const coupons = await klaviyoClient.get('/coupons/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(coupons, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving coupons: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get coupons from Klaviyo" }
      );

      // Create coupon code
      server.tool(
        "create_coupon_code",
        {
          coupon_id: z.string().describe("ID of the coupon"),
          code: z.string().describe("Coupon code")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: "coupon-code",
                attributes: {
                  code: params.code
                },
                relationships: {
                  coupon: {
                    data: {
                      type: "coupon",
                      id: params.coupon_id
                    }
                  }
                }
              }
            };
            
            const result = await klaviyoClient.post('/coupon-codes/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating coupon code: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Create a new coupon code in Klaviyo" }
      );
    }
