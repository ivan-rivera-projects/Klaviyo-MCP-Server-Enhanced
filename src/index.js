#!/usr/bin/env node
import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config({ path: './.env' });

// Import our enhanced transport instead of the original
import { StdioServerTransport, isErrorSuppressionActive } from './pre-init-error-suppressor.js';
import { server } from './server.js';
import logger from './utils/logger.js';
import { clearExpiredCache, getCacheStats } from './utils/cache.js';
// Import our enhanced error handling
import { initErrorHandling } from './features/error_handling/index.js';

logger.info('Starting Klaviyo MCP server...');
logger.info(`Pre-initialization error suppression: ${isErrorSuppressionActive() ? 'ACTIVE' : 'INACTIVE'}`);

// Set up periodic cache stats logging
setInterval(() => {
  const stats = getCacheStats();
  logger.debug('Cache statistics', stats);
}, 300000); // Log cache stats every 5 minutes

// Start receiving messages on stdin and sending messages on stdout
try {
  const transport = new StdioServerTransport();
  
  // Use our enhanced error handling for runtime
  initErrorHandling(server, transport);
  
  await server.connect(transport);
  logger.info('Klaviyo MCP server connected and ready');
} catch (error) {
  logger.error('Failed to start MCP server:', error);
}
