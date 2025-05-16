/**
 * MCP Pre-Initialization Error Suppressor
 * 
 * This script must be loaded as early as possible in the process to
 * suppress JSON errors during the initial connection phase.
 */

// Store the original StdioServerTransport implementation
import { StdioServerTransport as OriginalTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import logger from './utils/logger.js';

// Create patched version with early error suppression
class EnhancedStdioServerTransport extends OriginalTransport {
  constructor(...args) {
    super(...args);
    
    // Add error handler right at creation time
    this.onerror = (error) => {
      if (error.message && (
          error.message.includes('JSON') || 
          error.message.includes('Unexpected token') ||
          error.message.includes('Unexpected end of') ||
          error.message.includes('non-whitespace character') ||
          error.message.includes('property name') ||
          error.message.includes('position')
        )) {
        // Silently suppress JSON errors during startup
        logger.debug('Pre-init: Suppressing JSON parsing error');
      } else {
        // For other errors, log normally but don't crash
        logger.error('Pre-init: MCP transport error:', error);
      }
    };
    
    // Patch the _readBuffer to handle errors immediately
    if (this._readBuffer) {
      const originalReadMessage = this._readBuffer.readMessage.bind(this._readBuffer);
      
      this._readBuffer.readMessage = function() {
        try {
          return originalReadMessage();
        } catch (error) {
          if (error.message && (
              error.message.includes('JSON') ||
              error.message.includes('Unexpected token') ||
              error.message.includes('Unexpected end of') ||
              error.message.includes('non-whitespace character') ||
              error.message.includes('property name') ||
              error.message.includes('position')
            )) {
            
            // Skip past this problematic message if possible
            if (this._buffer) {
              const newlineIndex = this._buffer.indexOf('\n');
              if (newlineIndex !== -1) {
                this._buffer = this._buffer.subarray(newlineIndex + 1);
                logger.debug('Pre-init: Skipped malformed JSON message');
              }
            }
            
            // Return null to indicate no valid message was found
            return null;
          }
          
          // Re-throw other errors
          throw error;
        }
      };
    }
    
    logger.debug('Pre-init: Enhanced error suppression installed');
  }
  
  // Override processReadBuffer to add early error handling
  processReadBuffer() {
    try {
      // Process any complete messages in the buffer
      while (true) {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }
        
        if (this.onmessage) {
          this.onmessage(message);
        }
      }
    } catch (error) {
      if (this.onerror) {
        this.onerror(error);
      }
    }
  }
}

// Export our enhanced transport
export { EnhancedStdioServerTransport as StdioServerTransport };

// Also export a function to check if the patch was applied
export function isErrorSuppressionActive() {
  return true;
}
