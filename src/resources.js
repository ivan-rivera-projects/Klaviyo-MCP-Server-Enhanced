import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import * as klaviyoClient from './klaviyo-client.js';

    export function registerResources(server) {
      // Profile resource
      server.resource(
        "profile",
        new ResourceTemplate("klaviyo://profile/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const profile = await klaviyoClient.get(`/profiles/${id}/`);
            const jsonText = JSON.stringify(profile, null, 2);
            console.debug(`Resource profile JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching profile: ${error.message}`
              }]
            };
          }
        }
      );

      // List resource
      server.resource(
        "list",
        new ResourceTemplate("klaviyo://list/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const list = await klaviyoClient.get(`/lists/${id}/`);
            const jsonText = JSON.stringify(list, null, 2);
            console.debug(`Resource list JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching list: ${error.message}`
              }]
            };
          }
        }
      );

      // Segment resource
      server.resource(
        "segment",
        new ResourceTemplate("klaviyo://segment/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const segment = await klaviyoClient.get(`/segments/${id}/`);
            const jsonText = JSON.stringify(segment, null, 2);
            console.debug(`Resource segment JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching segment: ${error.message}`
              }]
            };
          }
        }
      );

      // Campaign resource
      server.resource(
        "campaign",
        new ResourceTemplate("klaviyo://campaign/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const campaign = await klaviyoClient.get(`/campaigns/${id}/`);
            const jsonText = JSON.stringify(campaign, null, 2);
            console.debug(`Resource campaign JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching campaign: ${error.message}`
              }]
            };
          }
        }
      );

      // Flow resource
      server.resource(
        "flow",
        new ResourceTemplate("klaviyo://flow/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const flow = await klaviyoClient.get(`/flows/${id}/`);
            const jsonText = JSON.stringify(flow, null, 2);
            console.debug(`Resource flow JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching flow: ${error.message}`
              }]
            };
          }
        }
      );

      // Template resource
      server.resource(
        "template",
        new ResourceTemplate("klaviyo://template/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const template = await klaviyoClient.get(`/templates/${id}/`);
            const jsonText = JSON.stringify(template, null, 2);
            console.debug(`Resource template JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching template: ${error.message}`
              }]
            };
          }
        }
      );

      // Metric resource
      server.resource(
        "metric",
        new ResourceTemplate("klaviyo://metric/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const metric = await klaviyoClient.get(`/metrics/${id}/`);
            const jsonText = JSON.stringify(metric, null, 2);
            console.debug(`Resource metric JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching metric: ${error.message}`
              }]
            };
          }
        }
      );

      // Catalog resource
      server.resource(
        "catalog",
        new ResourceTemplate("klaviyo://catalog/{id}", { list: undefined }),
        async (uri, { id }) => {
          try {
            const catalog = await klaviyoClient.get(`/catalogs/${id}/`);
            const jsonText = JSON.stringify(catalog, null, 2);
            console.debug(`Resource catalog JSON text: ${jsonText}`);
            return {
              contents: [{
                uri: uri.href,
                text: jsonText
              }]
            };
          } catch (error) {
            return {
              contents: [{
                uri: uri.href,
                text: `Error fetching catalog: ${error.message}`
              }]
            };
          }
        }
      );
    }
