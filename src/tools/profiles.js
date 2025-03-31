import { z } from 'zod';
    import * as klaviyoClient from '../klaviyo-client.js';

    export function registerProfileTools(server) {
      // Get profiles
      server.tool(
        "get_profiles",
        {
          filter: z.string().optional().describe("Filter query for profiles"),
          page_size: z.number().min(1).max(100).optional().describe("Number of profiles per page (1-100)"),
          page_cursor: z.string().optional().describe("Cursor for pagination")
        },
        async (params) => {
          try {
            const profiles = await klaviyoClient.get('/profiles/', params);
            return {
              content: [{ type: "text", text: JSON.stringify(profiles, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving profiles: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get profiles from Klaviyo" }
      );

      // Get profile
      server.tool(
        "get_profile",
        {
          id: z.string().describe("ID of the profile to retrieve")
        },
        async (params) => {
          try {
            const profile = await klaviyoClient.get(`/profiles/${params.id}/`);
            return {
              content: [{ type: "text", text: JSON.stringify(profile, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error retrieving profile: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Get a specific profile from Klaviyo" }
      );

      // Create profile
      server.tool(
        "create_profile",
        {
          email: z.string().email().optional().describe("Email address of the profile"),
          phone_number: z.string().optional().describe("Phone number of the profile"),
          external_id: z.string().optional().describe("External ID for the profile"),
          first_name: z.string().optional().describe("First name of the profile"),
          last_name: z.string().optional().describe("Last name of the profile"),
          properties: z.record(z.any()).optional().describe("Additional properties for the profile")
        },
        async (params) => {
          try {
            const attributes = {};
            
            // Add all provided fields to attributes
            for (const [key, value] of Object.entries(params)) {
              if (value !== undefined && key !== 'properties') {
                attributes[key] = value;
              }
            }
            
            // Add properties if provided
            if (params.properties) {
              attributes.properties = params.properties;
            }
            
            const payload = {
              data: {
                type: "profile",
                attributes
              }
            };
            
            const result = await klaviyoClient.post('/profiles/', payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error creating profile: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Create a new profile in Klaviyo" }
      );

      // Update profile
      server.tool(
        "update_profile",
        {
          id: z.string().describe("ID of the profile to update"),
          email: z.string().email().optional().describe("Email address of the profile"),
          phone_number: z.string().optional().describe("Phone number of the profile"),
          external_id: z.string().optional().describe("External ID for the profile"),
          first_name: z.string().optional().describe("First name of the profile"),
          last_name: z.string().optional().describe("Last name of the profile"),
          properties: z.record(z.any()).optional().describe("Additional properties for the profile")
        },
        async (params) => {
          try {
            const { id, ...rest } = params;
            const attributes = {};
            
            // Add all provided fields to attributes
            for (const [key, value] of Object.entries(rest)) {
              if (value !== undefined && key !== 'properties') {
                attributes[key] = value;
              }
            }
            
            // Add properties if provided
            if (params.properties) {
              attributes.properties = params.properties;
            }
            
            const payload = {
              data: {
                type: "profile",
                id,
                attributes
              }
            };
            
            const result = await klaviyoClient.patch(`/profiles/${id}/`, payload);
            return {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error updating profile: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Update an existing profile in Klaviyo" }
      );

      // Delete profile
      server.tool(
        "delete_profile",
        {
          id: z.string().describe("ID of the profile to delete")
        },
        async (params) => {
          try {
            await klaviyoClient.del(`/profiles/${params.id}/`);
            return {
              content: [{ type: "text", text: "Profile deleted successfully" }]
            };
          } catch (error) {
            return {
              content: [{ type: "text", text: `Error deleting profile: ${error.message}` }],
              isError: true
            };
          }
        },
        { description: "Delete a profile from Klaviyo" }
      );
    }
