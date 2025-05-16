/**
 * Error Handling Feature
 * 
 * This module integrates enhanced error handling for the Klaviyo MCP Server.
 * It provides utilities for making the server more robust against malformed inputs,
 * particularly focusing on JSON parsing errors that are being displayed to users.
 */

import { enhanceMcpTransport } from './mcp_handler.js';
import { sanitizeJson, safeJsonParse } from './json_parser.js';
import logger from '../../utils/logger.js';

/**
 * Initialize enhanced error handling for MCP server
 * @param {Object} server - MCP server instance
 * @param {Object} transport - StdioServerTransport instance
 */
export function initErrorHandling(server, transport) {
  logger.info('Initializing enhanced error handling');
  
  // Patch the transport with our enhanced handler
  enhanceMcpTransport(transport);
  
  // Add error event listener to the server if it has one
  if (server && typeof server.on === 'function') {
    server.on('error', (error) => {
      if (error.message && (
          error.message.includes('JSON') || 
          error.message.includes('Unexpected token') ||
          error.message.includes('Unexpected end of') ||
          error.message.includes('non-whitespace character')
        )) {
        // For JSON parsing errors, just log at debug level
        logger.debug('Suppressing JSON parsing error in MCP server');
      } else {
        // For other errors, log normally
        logger.error('MCP server error:', error);
      }
    });
  }
  
  logger.info('Enhanced error handling initialized');
}

// Export all utilities for potential reuse
export {
  enhanceMcpTransport,
  sanitizeJson,
  safeJsonParse
};

export default {
  initErrorHandling,
  enhanceMcpTransport,
  sanitizeJson,
  safeJsonParse
};
