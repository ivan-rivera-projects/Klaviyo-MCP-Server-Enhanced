/**
 * Enhanced MCP Error Handler
 * 
 * This module provides improved error handling for MCP communication,
 * with special focus on JSON parsing errors that are being displayed to users.
 */

import logger from '../../utils/logger.js';
import { sanitizeJson, safeJsonParse } from './json_parser.js';

/**
 * Reads and processes a buffer in a safe manner that handles JSON errors gracefully
 * @param {ReadBuffer} readBuffer - The buffer to process
 * @param {Function} onmessage - Callback for valid messages
 */
function safeProcessBuffer(readBuffer, onmessage) {
  if (!readBuffer || typeof readBuffer.readMessage !== 'function') {
    return;
  }
  
  try {
    const message = readBuffer.readMessage();
    if (message === null) {
      return null;
    }
    
    if (onmessage && typeof onmessage === 'function') {
      onmessage(message);
    }
    return message;
  } catch (error) {
    // This is where JSON parsing errors would occur
    if (error.message && (
        error.message.includes('JSON') || 
        error.message.includes('Unexpected token') ||
        error.message.includes('Unexpected end of') ||
        error.message.includes('non-whitespace character')
      )) {
      
      logger.debug('JSON error in buffer processing:', error);
      
      // Try to access the internal buffer directly for advanced recovery
      // This is risky but worth attempting
      if (readBuffer._buffer) {
        try {
          // Get the content as string
          const bufferContent = readBuffer._buffer.toString('utf8');
          
          // Look for complete JSON objects
          const newlineIndex = bufferContent.indexOf('\n');
          
          if (newlineIndex !== -1) {
            // Extract and try to sanitize the JSON
            const line = bufferContent.substring(0, newlineIndex);
            const sanitized = sanitizeJson(line);
            
            // If sanitization successful, try to parse
            if (sanitized !== line) {
              const parsed = safeJsonParse(sanitized);
              
              if (parsed) {
                // Skip past this message in the buffer
                readBuffer._buffer = readBuffer._buffer.subarray(newlineIndex + 1);
                logger.info('Successfully recovered from malformed JSON');
                
                if (onmessage && typeof onmessage === 'function') {
                  onmessage(parsed);
                }
                return parsed;
              }
            }
          }
          
          // If we can't recover, skip to the next newline to avoid getting
          // stuck on the same bad message
          if (newlineIndex !== -1) {
            logger.debug('Skipping malformed JSON message');
            readBuffer._buffer = readBuffer._buffer.subarray(newlineIndex + 1);
          } else {
            // If no newline, clear the buffer completely as it might be corrupted
            logger.debug('Clearing potentially corrupted buffer');
            readBuffer.clear();
          }
        } catch (recoveryError) {
          logger.debug('Error during JSON recovery attempt:', recoveryError);
          // Last resort: clear the buffer
          readBuffer.clear();
        }
      }
      
      return null;
    }
    
    // For non-JSON errors, re-throw
    throw error;
  }
}

/**
 * Enhanced version of the MCP transport patcher
 * @param {Object} transport - The StdioServerTransport instance to patch
 */
export function enhanceMcpTransport(transport) {
  if (!transport) {
    return;
  }
  
  // Add custom error handler
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
  
  // Create an enhanced version of the ReadBuffer's readMessage method
  if (transport._readBuffer) {
    const originalReadMessage = transport._readBuffer.readMessage.bind(transport._readBuffer);
    
    transport._readBuffer.readMessage = function() {
      try {
        return originalReadMessage();
      } catch (error) {
        if (error.message && (
            error.message.includes('JSON') ||
            error.message.includes('Unexpected token') ||
            error.message.includes('Unexpected end of') ||
            error.message.includes('non-whitespace character')
          )) {
          
          // Get buffer content as string
          const bufferContent = this._buffer ? this._buffer.toString('utf8') : '';
          
          // Try to sanitize the JSON before the first newline
          const newlineIndex = bufferContent.indexOf('\n');
          
          if (newlineIndex !== -1) {
            const line = bufferContent.substring(0, newlineIndex);
            const sanitized = sanitizeJson(line);
            
            if (sanitized !== line) {
              // Try to parse the sanitized JSON
              try {
                const parsed = JSON.parse(sanitized);
                
                // If successful, advance the buffer past this message
                this._buffer = this._buffer.subarray(newlineIndex + 1);
                logger.debug('Successfully sanitized malformed JSON');
                
                return parsed;
              } catch (parseError) {
                // If still can't parse, skip this message
                this._buffer = this._buffer.subarray(newlineIndex + 1);
                logger.debug('Skipping unparsable JSON message');
                return null;
              }
            } else {
              // If sanitization didn't change anything, skip this message
              this._buffer = this._buffer.subarray(newlineIndex + 1);
              logger.debug('Skipping malformed JSON message (sanitization ineffective)');
              return null;
            }
          } else {
            // No newline found, clear the buffer to avoid getting stuck
            this.clear();
            logger.debug('Cleared buffer due to malformed JSON with no delimiter');
            return null;
          }
        }
        
        // Re-throw non-JSON errors
        throw error;
      }
    };
  }
  
  // Override the processReadBuffer method to add robust error handling
  if (typeof transport.processReadBuffer === 'function') {
    const originalProcessReadBuffer = transport.processReadBuffer.bind(transport);
    
    transport.processReadBuffer = function() {
      try {
        // Process messages in a loop until buffer is exhausted
        while (true) {
          // Use our safe processor instead of the standard one
          const message = safeProcessBuffer(this._readBuffer, this.onmessage?.bind(this));
          
          // Exit the loop when there are no more complete messages
          if (message === null) {
            break;
          }
        }
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
  enhanceMcpTransport,
  safeProcessBuffer
};
