import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerDataPrivacyTools(server) {
      // Request profile deletion
      server.tool(
        "request_profile_deletion",
        {
          email: z.string().email().optional().describe("Email of the profile to delete"),
          phone_number: z.string().optional().describe("Phone number of the profile to delete"),
          profile_id: z.string().optional().describe("ID of the profile to delete")
        },
        async (params) => {
          try {
            const payload = {
              data: {
                type: "data-privacy-deletion-job",
                attributes: {}
              }
            };
            
            if (params.email) {
              payload.data.attributes.email = params.email;
            }
            
            if (params.phone_number) {
              payload.data.attributes.phone_number = params.phone_number;
            }
            
            if (params.profile_id) {
              payload.data.attributes.profile_id = params.profile_id;
            }
            
            const result = await klaviyoClient.post('/data-privacy-deletion-jobs/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error requesting profile deletion: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Request deletion of a profile for data privacy compliance" }
      );
    }
