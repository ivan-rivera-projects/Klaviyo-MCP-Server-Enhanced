/**
 * Enhanced logging utility for Klaviyo MCP Server
 * 
 * Provides structured logging with different log levels and
 * specialized logging for API requests and responses.
 */

import fs from 'fs';
import path from 'path';
import { LOG_CONFIG } from '../config.js';

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get numeric value for configured log level
const configuredLevel = LOG_LEVELS[LOG_CONFIG.level] || LOG_LEVELS.info;

// Ensure log directory exists
const logDir = path.dirname(LOG_CONFIG.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Mask sensitive data in objects for logging
 * @param {Object} data - Data to mask
 * @returns {Object} - Masked data
 */
function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['api_key', 'password', 'token', 'Authorization', 'auth', 'key'];
  const maskedData = { ...data };
  
  for (const key in maskedData) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      if (typeof maskedData[key] === 'string') {
        // Mask all but first and last 4 characters
        const value = maskedData[key];
        if (value.length > 8) {
          maskedData[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          maskedData[key] = '********';
        }
      } else {
        maskedData[key] = '********';
      }
    } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  }
  
  return maskedData;
}

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
function formatLogMessage(level, message) {
  const timestamp = LOG_CONFIG.includeTimestamp ? new Date().toISOString() : '';
  return `${timestamp ? `[${timestamp}] ` : ''}[${level.toUpperCase()}] ${message}`;
}

/**
 * Write log message to file
 * @param {string} message - Message to log
 */
function writeToLogFile(message) {
  fs.appendFileSync(LOG_CONFIG.file, message + '\n');
}

/**
 * Log at specified level if enabled
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 */
function log(level, message, data) {
  // Check if this log level should be logged
  if (LOG_LEVELS[level] < configuredLevel) return;
  
  let logMessage = formatLogMessage(level, message);
  
  // Add data if provided
  if (data !== undefined) {
    const dataToLog = LOG_CONFIG.maskSensitiveData ? maskSensitiveData(data) : data;
    logMessage += `\n${typeof dataToLog === 'object' ? JSON.stringify(dataToLog, null, 2) : dataToLog}`;
  }
  
  // Write to log file
  writeToLogFile(logMessage);
  
  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    const consoleMethod = level === 'error' ? console.error : 
                          level === 'warn' ? console.warn : 
                          level === 'debug' ? console.debug : 
                          console.log;
    consoleMethod(logMessage);
  }
}

// Create logger object with methods for each log level
const logger = {
  debug: (message, data) => log('debug', message, data),
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
  
  // Specialized methods for API logging
  request: (method, url, data) => {
    if (!LOG_CONFIG.logRequests) return;
    log('debug', `API Request: ${method} ${url}`, data);
  },
  
  response: (method, url, status, data) => {
    if (!LOG_CONFIG.logResponses) return;
    log('debug', `API Response: ${method} ${url} (${status})`, data);
  },
  
  apiError: (method, url, error) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : undefined,
      request: error.request ? 'Request was made but no response received' : undefined
    };
    
    log('error', `API Error: ${method} ${url}`, errorData);
  }
};

export default logger;
