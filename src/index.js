#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { clearExpiredCache, getCacheStats } from './utils/cache.js';

// Load environment variables
dotenv.config();

logger.info('Starting Klaviyo MCP server...');

// Set up periodic cache stats logging
setInterval(() => {
  const stats = getCacheStats();
  logger.debug('Cache statistics', stats);
}, 300000); // Log cache stats every 5 minutes

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);

logger.info('Klaviyo MCP server connected and ready');
