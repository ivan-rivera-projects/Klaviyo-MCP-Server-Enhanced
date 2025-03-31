import axios from 'axios';

    // Create a client with the API key
    const apiKey = process.env.KLAVIYO_API_KEY;
    if (!apiKey) {
      console.warn('KLAVIYO_API_KEY environment variable is not set. API calls will fail.');
    }

    const client = axios.create({
      baseURL: 'https://a.klaviyo.com/api',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Revision': '2023-10-15'
      }
    });

    // Generic request methods
    export async function get(endpoint, params = {}) {
      try {
        const queryParams = new URLSearchParams();
        
        if (params.filter) {
          queryParams.append('filter', params.filter);
        }
        
        if (params.page_size) {
          queryParams.append('page[size]', params.page_size);
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
        const response = await client.get(url);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }

    export async function post(endpoint, data) {
      try {
        const response = await client.post(endpoint, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }

    export async function patch(endpoint, data) {
      try {
        const response = await client.patch(endpoint, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }

    export async function del(endpoint, data) {
      try {
        const config = data ? { data } : undefined;
        const response = await client.delete(endpoint, config);
        return response.status === 204 ? { success: true } : response.data;
      } catch (error) {
        handleError(error);
      }
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
