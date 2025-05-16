#!/usr/bin/env node

/**
 * Klaviyo MCP Server Startup Wrapper
 * 
 * This script provides additional error suppression for Claude Desktop
 * by intercepting and handling JSON parsing errors during startup.
 */

// Set environment variables to suppress node warnings
process.env.NODE_NO_WARNINGS = '1';
process.env.SUPPRESS_JSON_ERRORS = 'true';

// Store original console methods to restore later
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console.error to filter out JSON errors
console.error = function(...args) {
  if (args.length > 0 && typeof args[0] === 'string') {
    if (args[0].includes('JSON') || 
        args[0].includes('Unexpected token') ||
        args[0].includes('parse') ||
        args[0].includes('position') ||
        args[0].includes('SyntaxError')) {
      // Silently suppress JSON-related errors
      return;
    }
  }
  originalConsoleError.apply(console, args);
};

// Override console.warn to filter out warnings about malformed messages
console.warn = function(...args) {
  if (args.length > 0 && typeof args[0] === 'string') {
    if (args[0].includes('malformed') || 
        args[0].includes('Invalid') ||
        args[0].includes('JSON') ||
        args[0].includes('Unexpected')) {
      // Silently suppress related warnings
      return;
    }
  }
  originalConsoleWarn.apply(console, args);
};

// Handle global uncaught exceptions to prevent crash on parse errors
process.on('uncaughtException', (error) => {
  if (error.message && (
      error.message.includes('JSON') ||
      error.message.includes('Unexpected token') ||
      error.message.includes('Unexpected end of') ||
      error.message.includes('non-whitespace')
    )) {
    // Silently suppress JSON parsing errors
    console.log('Suppressed JSON parsing error during startup');
  } else {
    // For other uncaught exceptions, log properly
    console.error('Uncaught exception:', error);
  }
});

// Import and run the main server entry point
console.log('Starting Klaviyo MCP server with enhanced error suppression...');
import('./src/index.js').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// After a delay, restore original console methods
setTimeout(() => {
  console.log('Initializing complete, restoring standard error handling');
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}, 5000); // Restore after 5 seconds when startup should be complete
