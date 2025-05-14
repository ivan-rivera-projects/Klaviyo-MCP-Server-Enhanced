#!/usr/bin/env node
import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config({ path: './.env' });

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';
import logger from './utils/logger.js';
import { clearExpiredCache, getCacheStats } from './utils/cache.js';
import { patchMcpTransport } from './utils/mcp-error-handler.js';

logger.info('Starting Klaviyo MCP server...');

// Set up periodic cache stats logging
setInterval(() => {
  const stats = getCacheStats();
  logger.debug('Cache statistics', stats);
}, 300000); // Log cache stats every 5 minutes

// Start receiving messages on stdin and sending messages on stdout
try {
  const transport = new StdioServerTransport();
  
  // Patch the transport with enhanced error handling
  patchMcpTransport(transport);
  
  await server.connect(transport);
  logger.info('Klaviyo MCP server connected and ready');
} catch (error) {
  logger.error('Failed to start MCP server:', error);
}
