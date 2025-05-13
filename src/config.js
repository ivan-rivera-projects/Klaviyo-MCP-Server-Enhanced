/**
 * Centralized configuration for the Klaviyo MCP Server
 *
 * This file contains all configurable parameters for the Klaviyo API integration.
 * Centralizing these values makes it easier to update when API changes occur.
 */

// Load environment variables directly if not already loaded
// This ensures config can be used independently without relying on dotenv being loaded elsewhere
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

// API Configuration
export const API_CONFIG = {
  baseURL: 'https://a.klaviyo.com/api',
  revision: '2024-06-15', // Updated to the latest available API revision
  defaultPageSize: 50,
  maxPageSize: 100,
  defaultTimeframe: 'last_30_days',
  defaultConversionMetricId: 'VevE7N', // Placed Order metric ID
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffFactor: 2, // Exponential backoff multiplier
};

// Caching Configuration
export const CACHE_CONFIG = {
  enabled: true,
  ttlSeconds: {
    metrics: 3600, // 1 hour
    campaigns: 1800, // 30 minutes
    templates: 3600, // 1 hour
    profiles: 300, // 5 minutes
    default: 600, // 10 minutes
  },
  maxSize: 100, // Maximum number of items to cache per type
};

// Logging Configuration
export const LOG_CONFIG = {
  level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
  file: process.env.LOG_FILE || '/tmp/klaviyo-mcp.log',
  includeTimestamp: true,
  logRequests: true,
  logResponses: process.env.LOG_RESPONSES === 'true' || false, // Can be verbose
  maskSensitiveData: true,
};

// Valid Statistics for Campaign Values Reports
export const VALID_CAMPAIGN_STATISTICS = [
  'delivered',
  'open_rate',
  'click_rate',
  'bounce_rate',
  'unsubscribe_rate',
  'revenue_per_recipient',
  // Removing statistics that are not supported
  // 'spam_rate',
];

// Default Statistics Sets
export const DEFAULT_STATISTICS = {
  basic: ['delivered'],
  standard: ['delivered', 'open_rate', 'click_rate', 'bounce_rate'],
  comprehensive: [
    'delivered',
    'open_rate',
    'click_rate',
    'bounce_rate',
    'unsubscribe_rate',
    'revenue_per_recipient',
  ],
};

// Valid Measurements for Metric Aggregates
export const VALID_MEASUREMENTS = [
  'count',
  'unique',
  'sum',
  'average',
  'min',
  'max',
];

// Timeframe Options
export const TIMEFRAME_OPTIONS = {
  today: 'today',
  yesterday: 'yesterday',
  last_7_days: 'last_7_days',
  last_14_days: 'last_14_days',
  last_30_days: 'last_30_days',
  last_90_days: 'last_90_days',
  last_month: 'last_month',
  this_month: 'this_month',
  all_time: 'all_time',
};

// Filter Templates
export const FILTER_TEMPLATES = {
  campaignId: (id) => `equals(campaign_id,\"${id}\")`,
  dateRange: (start, end) => [
    `greater-or-equal(datetime,${start})`,
    `less-than(datetime,${end})`,
  ],
};

// Export a default configuration object
export default {
  api: API_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  cache: CACHE_CONFIG,
  log: LOG_CONFIG,
  validCampaignStatistics: VALID_CAMPAIGN_STATISTICS,
  defaultStatistics: DEFAULT_STATISTICS,
  validMeasurements: VALID_MEASUREMENTS,
  timeframeOptions: TIMEFRAME_OPTIONS,
  filterTemplates: FILTER_TEMPLATES,
};
