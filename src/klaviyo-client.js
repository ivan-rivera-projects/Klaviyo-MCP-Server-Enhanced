import axios from 'axios';
import { API_CONFIG, RATE_LIMIT_CONFIG } from './config.js';
import logger from './utils/logger.js';
import { getCache, setCache, hasCache } from './utils/cache.js';

// Create a client with the API key
const apiKey = process.env.KLAVIYO_API_KEY;
if (!apiKey) {
  logger.error('KLAVIYO_API_KEY environment variable is not set. API calls will fail.');
  throw new Error('KLAVIYO_API_KEY environment variable is required. Please set it before starting the server.');
}

const client = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Revision': API_CONFIG.revision
  }
});

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate backoff delay for retries
 * @param {number} retryCount - Current retry attempt
 * @returns {number} - Delay in milliseconds
 */
function calculateBackoffDelay(retryCount) {
  const delay = Math.min(
    RATE_LIMIT_CONFIG.initialDelayMs * Math.pow(RATE_LIMIT_CONFIG.backoffFactor, retryCount),
    RATE_LIMIT_CONFIG.maxDelayMs
  );

  // Add some jitter to prevent all clients retrying simultaneously
  return delay * (0.8 + Math.random() * 0.4);
}

/**
 * Check if error is due to rate limiting
 * @param {Error} error - Error to check
 * @returns {boolean} - True if rate limited
 */
function isRateLimitError(error) {
  return (
    error.response &&
    (error.response.status === 429 ||
     (error.response.status === 400 &&
      error.response.data?.errors?.some(e =>
        e.detail?.toLowerCase().includes('rate limit') ||
        e.title?.toLowerCase().includes('rate limit')
      )
     )
    )
  );
}

/**
 * Execute a request with retry logic
 * @param {Function} requestFn - Function that returns a promise for the request
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} [requestData] - Request data or params
 * @param {Function} [fallbackFn] - Optional fallback function to call if all retries fail
 * @returns {Promise} - Promise that resolves with the response data
 */
async function executeWithRetry(requestFn, method, endpoint, requestData, fallbackFn) {
  let retries = 0;

  // For debugging only - don't use directly in API calls
  const debugData = requestData;

  // Check cache first if it's a GET request
  const cacheKey = method === 'GET' ? `${endpoint}` : null;
  if (method === 'GET' && hasCache(cacheKey)) {
    logger.debug(`Cache hit for ${method} ${endpoint}`);
    return getCache(cacheKey);
  }

  while (true) {
    try {
      logger.request(method, endpoint, debugData);

      const response = await requestFn();

      logger.response(method, endpoint, response.status, response.data);

      // Cache the response if it's a GET request
      if (method === 'GET' && cacheKey) {
        setCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      if (isRateLimitError(error) && retries < RATE_LIMIT_CONFIG.maxRetries) {
        retries++;
        const delay = calculateBackoffDelay(retries);

        logger.warn(`Rate limit exceeded for ${method} ${endpoint}. Retrying in ${Math.round(delay / 1000)}s (attempt ${retries}/${RATE_LIMIT_CONFIG.maxRetries})`);

        await sleep(delay);
        continue;
      }

      logger.apiError(method, endpoint, error);
      
      // Try fallback if provided
      if (fallbackFn) {
        try {
          logger.info(`Attempting fallback for ${method} ${endpoint}`);
          const fallbackResponse = await fallbackFn(error);
          logger.info(`Fallback successful for ${method} ${endpoint}`);
          return fallbackResponse;
        } catch (fallbackError) {
          logger.error(`Fallback failed for ${method} ${endpoint}`, {
            originalError: error.message,
            fallbackError: fallbackError.message
          });
          // Continue to throw the original error since fallback also failed
        }
      }
      
      handleError(error);
    }
  }
}

// Generic request methods
export async function get(endpoint, params = {}, fallbackFn) {
  // Build the URL with query parameters according to Klaviyo API specs
  let url = endpoint;
  const queryParams = [];
  
  // Handle filter parameter if provided
  if (params.filter) {
    queryParams.push(`filter=${encodeURIComponent(params.filter)}`);
  }
  
  // Handle include parameter if provided
  if (params.include) {
    queryParams.push(`include=${encodeURIComponent(params.include)}`);
  }
  
  // Handle page_size parameter if provided
  if (params.page_size) {
    queryParams.push(`page[size]=${params.page_size}`);
  }
  
  // Handle pagination cursor if provided
  if (params.page_cursor) {
    queryParams.push(`page[cursor]=${params.page_cursor}`);
  }
  
  // Add query parameters to URL
  if (queryParams.length > 0) {
    url = `${endpoint}?${queryParams.join('&')}`;
  }
  
  logger.debug(`Prepared GET request to: ${url}`);
  
  return executeWithRetry(
    () => client.get(url),
    'GET',
    endpoint,
    params,
    fallbackFn
  );
}

export async function post(endpoint, data, fallbackFn) {
  return executeWithRetry(
    () => client.post(endpoint, data),
    'POST',
    endpoint,
    data,
    fallbackFn
  );
}

export async function patch(endpoint, data, fallbackFn) {
  return executeWithRetry(
    () => client.patch(endpoint, data),
    'PATCH',
    endpoint,
    data,
    fallbackFn
  );
}

export async function del(endpoint, data, fallbackFn) {
  return executeWithRetry(
    () => {
      const config = data ? { data } : undefined;
      return client.delete(endpoint, config);
    },
    'DELETE',
    endpoint,
    data,
    fallbackFn
  ).then(response => {
    // For DELETE requests that return 204 No Content
    if (response === undefined) {
      return { success: true };
    }
    return response;
  });
}

function handleError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorData = error.response.data;
    
    // Enhanced error handling for JSON:API format
    let errorMessage = 'Unknown API error';
    
    if (errorData.errors && Array.isArray(errorData.errors)) {
      errorMessage = errorData.errors.map(e => {
        // Extract the most detailed error information available
        const detail = e.detail || e.title || '';
        const source = e.source?.pointer ? ` (source: ${e.source.pointer})` : '';
        const code = e.code ? ` [code: ${e.code}]` : '';
        return `${detail}${source}${code}`;
      }).join(', ');
    } else if (errorData.message) {
      // Fallback for non-standard error formats
      errorMessage = errorData.message;
    }

    // Include endpoint and status in error message
    const statusText = error.response.statusText ? ` ${error.response.statusText}` : '';
    throw new Error(`Klaviyo API Error (${error.response.status}${statusText}): ${errorMessage}`);
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response received from Klaviyo API. This could indicate network issues or an invalid endpoint.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error(`Error setting up request: ${error.message}`);
  }
}
