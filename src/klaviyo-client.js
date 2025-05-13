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
 * @returns {Promise} - Promise that resolves with the response data
 */
async function executeWithRetry(requestFn, method, endpoint, requestData) {
  let retries = 0;

  // Check cache first if it's a GET request
  const cacheKey = method === 'GET' ? `${endpoint}:${JSON.stringify(requestData || {})}` : null;
  if (method === 'GET' && hasCache(cacheKey)) {
    logger.debug(`Cache hit for ${method} ${endpoint}`);
    return getCache(cacheKey);
  }

  while (true) {
    try {
      logger.request(method, endpoint, requestData);

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
      handleError(error);
    }
  }
}

// Generic request methods
export async function get(endpoint, params = {}) {
  const queryParams = new URLSearchParams();

  if (params.filter) {
    queryParams.append('filter', params.filter);
  }

  if (params.page_size) {
    queryParams.append('page[size]', params.page_size);
  } else if (API_CONFIG.defaultPageSize) {
    queryParams.append('page[size]', API_CONFIG.defaultPageSize);
  }

  if (params.page_cursor) {
    queryParams.append('page[cursor]', params.page_cursor);
  }

  if (params.include) {
    queryParams.append('include', Array.isArray(params.include) ? params.include.join(',') : params.include);
  }

  if (params.fields) {
    Object.entries(params.fields).forEach(([resource, fields]) => {
      queryParams.append(`fields[${resource}]`, Array.isArray(fields) ? fields.join(',') : fields);
    });
  }

  if (params.sort) {
    queryParams.append('sort', params.sort);
  }

  const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;

  return executeWithRetry(
    () => client.get(url),
    'GET',
    endpoint,
    params
  );
}

export async function post(endpoint, data) {
  return executeWithRetry(
    () => client.post(endpoint, data),
    'POST',
    endpoint,
    data
  );
}

export async function patch(endpoint, data) {
  return executeWithRetry(
    () => client.patch(endpoint, data),
    'PATCH',
    endpoint,
    data
  );
}

export async function del(endpoint, data) {
  return executeWithRetry(
    () => {
      const config = data ? { data } : undefined;
      return client.delete(endpoint, config);
    },
    'DELETE',
    endpoint,
    data
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
    const errorMessage = errorData.errors ?
      errorData.errors.map(e => e.detail || e.title).join(', ') :
      'Unknown API error';

    throw new Error(`Klaviyo API Error (${error.response.status}): ${errorMessage}`);
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response received from Klaviyo API');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error(`Error setting up request: ${error.message}`);
  }
}
