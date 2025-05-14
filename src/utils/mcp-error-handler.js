/**
 * MCP Error Handler
 * 
 * This utility provides enhanced error handling for MCP communication,
 * making the server more robust against malformed input.
 */

import logger from './logger.js';

/**
 * Patches the MCP server transport to be more resilient to JSON errors
 * @param {Object} transport - The StdioServerTransport instance to patch
 */
export function patchMcpTransport(transport) {
  if (!transport) {
    return;
  }
  
  // Add custom error handler if not already present
  if (!transport.onerror) {
    transport.onerror = (error) => {
      if (error.message && (
          error.message.includes('JSON') || 
          error.message.includes('Unexpected token') ||
          error.message.includes('Unexpected end of') ||
          error.message.includes('non-whitespace character')
        )) {
        // For JSON parsing errors, just log at debug level and continue
        logger.debug('Suppressing JSON parsing error in MCP transport');
      } else {
        // For other errors, log normally but don't crash
        logger.error('MCP transport error:', error);
      }
    };
  }
  
  // Override the original processReadBuffer method if possible
  if (typeof transport.processReadBuffer === 'function') {
    const originalProcessReadBuffer = transport.processReadBuffer.bind(transport);
    
    transport.processReadBuffer = function() {
      try {
        originalProcessReadBuffer();
      } catch (error) {
        if (error.message && (
            error.message.includes('JSON') ||
            error.message.includes('Unexpected token') ||
            error.message.includes('Unexpected end of') ||
            error.message.includes('non-whitespace character')
          )) {
          logger.debug('Handled JSON error in processReadBuffer');
        } else {
          if (this.onerror) {
            this.onerror(error);
          }
        }
      }
    };
  }
  
  return transport;
}

export default {
  patchMcpTransport
};
