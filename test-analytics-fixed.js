#!/usr/bin/env node

/**
 * Test script for Klaviyo MCP Server analytics functionality
 *
 * This script tests the newly added analytics capabilities
 * of the Klaviyo MCP Server.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Setup logging
const logFile = path.join(process.cwd(), 'analytics-test.log');
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - INFO: ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    let logMessage = `${timestamp} - ERROR: ${message}\n`;
    if (error) {
      if (error.response) {
        // Log response error details
        logMessage += `Response status: ${error.response.status}\n`;
        logMessage += `Response data: ${JSON.stringify(error.response.data, null, 2)}\n`;
      } else if (error.request) {
        // Log that no response was received
        logMessage += `No response received from request: ${error.request}\n`;
      } else {
        // Log the error message
        logMessage += `Error: ${error.message}\n`;
      }
      logMessage += `Stack trace: ${error.stack}\n`;
    }
    console.error(message);
    fs.appendFileSync(logFile, logMessage);
  }
};

// Configuration
const API_KEY = process.env.KLAVIYO_API_KEY;
if (!API_KEY) {
  logger.error('KLAVIYO_API_KEY environment variable is required');
  process.exit(1);
}

// Clear previous log file
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}
logger.log('Starting new test log');

// Klaviyo API client
const client = axios.create({
  baseURL: 'https://a.klaviyo.com/api',
  headers: {
    'Authorization': `Klaviyo-API-Key ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Revision': '2024-02-15' // Updated from 2023-10-15
  }
});

// Test functions
async function testCampaigns() {
  logger.log('\n🔍 Testing campaign retrieval...');
  try {
    const response = await client.get('/campaigns/?filter=equals(messages.channel,\'email\')');
    logger.log(`✅ Successfully retrieved ${response.data.data.length} campaigns`);
    logger.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);

    if (response.data.data.length > 0) {
      const campaignId = response.data.data[0].id;
      logger.log(`\nUsing campaign ID: ${campaignId} for further tests`);
      return campaignId;
    } else {
      logger.log('⚠️ No campaigns found to test with');
      return null;
    }
  } catch (error) {
    logger.error('❌ Error retrieving campaigns:', error);
    return null;
  }
}

async function testCampaignMessages(campaignId) {
  if (!campaignId) return;

  logger.log('\n🔍 Testing campaign messages retrieval...');
  try {
    const response = await client.get(`/campaigns/${campaignId}/campaign-messages/`);
    logger.log(`✅ Successfully retrieved campaign messages`);
    logger.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);

    if (response.data.data.length > 0) {
      const messageId = response.data.data[0].id;
      logger.log(`\nUsing message ID: ${messageId} for further tests`);
      return messageId;
    } else {
      logger.log('⚠️ No messages found for this campaign');
      return null;
    }
  } catch (error) {
    logger.error('❌ Error retrieving campaign messages:', error);
    return null;
  }
}

async function testCampaignMetrics(campaignId) {
  if (!campaignId) return;

  logger.log('\n🔍 Testing campaign metrics retrieval...');
  try {
    // Updated payload structure based on Klaviyo API documentation
    const payload = {
      data: {
        type: "campaign-values-report",
        attributes: {
          statistics: ["delivered", "open_rate", "click_rate", "bounce_rate"],
          timeframe: {
            key: "last_30_days"
          },
          conversion_metric_id: "VevE7N", // Using Placed Order metric ID from metrics list
          filter: `equals(campaign_id,\"${campaignId}\")`
        }
      }
    };

    logger.log(`Request payload: ${JSON.stringify(payload, null, 2)}`);

    // Use the correct endpoint
    const response = await client.post('/campaign-values-reports/', payload);
    logger.log('✅ Successfully retrieved campaign metrics:');
    logger.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    logger.error('❌ Error retrieving campaign metrics:', error);

    // Fallback to basic statistics if the first attempt fails
    try {
      logger.log('\n🔍 Attempting with minimal statistics set...');
      const fallbackPayload = {
        data: {
          type: "campaign-values-report",
          attributes: {
            statistics: ["delivered"],
            timeframe: {
              key: "last_30_days"
            },
            conversion_metric_id: "VevE7N", // Using Placed Order metric ID from metrics list
            filter: `equals(campaign_id,\"${campaignId}\")`
          }
        }
      };

      logger.log(`Fallback payload: ${JSON.stringify(fallbackPayload, null, 2)}`);

      const fallbackResponse = await client.post('/campaign-values-reports/', fallbackPayload);
      logger.log('✅ Successfully retrieved basic campaign metrics:');
      logger.log(`Response data: ${JSON.stringify(fallbackResponse.data, null, 2)}`);
    } catch (fallbackError) {
      logger.error('❌ Error with fallback statistics approach:', fallbackError);
    }
  }
}

async function testMetricAggregates() {
  logger.log('\n🔍 Testing metrics retrieval...');
  try {
    const metricsResponse = await client.get('/metrics/');
    logger.log(`Retrieved metrics: ${JSON.stringify(metricsResponse.data, null, 2)}`);

    if (metricsResponse.data.data.length > 0) {
      const metricId = metricsResponse.data.data[0].id;
      logger.log(`Using metric ID: ${metricId} for aggregation test`);

      logger.log('\n🔍 Testing metric aggregates...');
      try {
        // Updated payload structure based on ANALYTICS.md
        const payload = {
          data: {
            type: "metric-aggregate", // Changed from metric-aggregate-query
            attributes: {
              metric_id: metricId,
              measurements: ["count"],
              interval: "day",
              filter: [
                "greater-or-equal(datetime,2025-04-13T00:00:00)",
                "less-than(datetime,2025-05-13T23:59:59)"
              ],
              timezone: "UTC"
            }
          }
        };

        logger.log(`Request payload: ${JSON.stringify(payload, null, 2)}`);

        const response = await client.post('/metric-aggregates/', payload);
        logger.log('✅ Successfully retrieved metric aggregates:');
        logger.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);
      } catch (error) {
        logger.error('❌ Error retrieving metric aggregates:', error);
      }
    } else {
      logger.log('⚠️ No metrics found to test aggregation');
    }
  } catch (error) {
    logger.error('❌ Error retrieving metrics:', error);
  }
}

// Main test function
async function runTests() {
  logger.log('🚀 Starting Klaviyo Analytics Tests\n');

  // Log environment info
  logger.log(`API Key (masked): ${API_KEY.substring(0, 6)}...${API_KEY.substring(API_KEY.length - 4)}`);
  logger.log(`Node.js version: ${process.version}`);

  const campaignId = await testCampaigns();
  const messageId = await testCampaignMessages(campaignId);
  await testCampaignMetrics(campaignId);
  await testMetricAggregates();

  logger.log('\n✨ Tests completed');
}

// Run the tests
runTests().catch(error => {
  logger.error('Error running tests:', error);
});
