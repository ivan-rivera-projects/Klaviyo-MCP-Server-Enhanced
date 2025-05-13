import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { registerResources } from './resources.js';
    import { registerProfileTools } from './tools/profiles.js';
    import { registerListTools } from './tools/lists.js';
    import { registerSegmentTools } from './tools/segments.js';
    import { registerEventTools } from './tools/events.js';
    import { registerMetricTools } from './tools/metrics.js';
    import { registerCampaignTools } from './tools/campaigns.js';
    import { registerReportingTools } from './tools/reporting.js';
    import { registerFlowTools } from './tools/flows.js';
    import { registerTemplateTools } from './tools/templates.js';
    import { registerCatalogTools } from './tools/catalogs.js';
    import { registerTagTools } from './tools/tags.js';
    import { registerWebhookTools } from './tools/webhooks.js';
    import { registerDataPrivacyTools } from './tools/data-privacy.js';
    import { registerCouponTools } from './tools/coupons.js';
    import { registerFormTools } from './tools/forms.js';
    import { registerReviewTools } from './tools/reviews.js';
    import { registerImageTools } from './tools/images.js';

    // Create an MCP server for Klaviyo
    const server = new McpServer({
      name: "Klaviyo API",
      version: "1.0.0",
      description: "MCP server for interacting with the Klaviyo API"
    });

    // Register all resources
    registerResources(server);

    // Register all tools
    registerProfileTools(server);
    registerListTools(server);
    registerSegmentTools(server);
    registerEventTools(server);
    registerMetricTools(server);
    registerCampaignTools(server);
    registerReportingTools(server);
    registerFlowTools(server);
    registerTemplateTools(server);
    registerCatalogTools(server);
    registerTagTools(server);
    registerWebhookTools(server);
    registerDataPrivacyTools(server);
    registerCouponTools(server);
    registerFormTools(server);
    registerReviewTools(server);
    registerImageTools(server);

    export { server };
