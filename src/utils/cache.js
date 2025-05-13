/**
 * Simple caching mechanism for Klaviyo API responses
 * 
 * Provides in-memory caching with TTL (time-to-live) for API responses
 * to reduce API calls and improve performance.
 */

import { CACHE_CONFIG } from '../config.js';
import logger from './logger.js';

// Cache storage
const cache = new Map();

// Cache metadata to track TTL and type
const metadata = new Map();

/**
 * Determine cache type from key
 * @param {string} key - Cache key
 * @returns {string} - Cache type
 */
function getCacheType(key) {
  if (key.startsWith('/metrics')) return 'metrics';
  if (key.startsWith('/campaigns')) return 'campaigns';
  if (key.startsWith('/templates')) return 'templates';
  if (key.startsWith('/profiles')) return 'profiles';
  return 'default';
}

/**
 * Get TTL for cache type
 * @param {string} type - Cache type
 * @returns {number} - TTL in seconds
 */
function getTtl(type) {
  return CACHE_CONFIG.ttlSeconds[type] || CACHE_CONFIG.ttlSeconds.default;
}

/**
 * Check if cache is enabled
 * @returns {boolean} - True if cache is enabled
 */
function isCacheEnabled() {
  return CACHE_CONFIG.enabled;
}

/**
 * Check if a key exists in the cache and is not expired
 * @param {string} key - Cache key
 * @returns {boolean} - True if key exists and is not expired
 */
export function hasCache(key) {
  if (!isCacheEnabled()) return false;
  
  if (!cache.has(key)) return false;
  
  const meta = metadata.get(key);
  if (!meta) return false;
  
  // Check if expired
  if (Date.now() > meta.expiresAt) {
    // Remove expired item
    cache.delete(key);
    metadata.delete(key);
    return false;
  }
  
  return true;
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} - Cached value or undefined if not found
 */
export function getCache(key) {
  if (!hasCache(key)) return undefined;
  
  const meta = metadata.get(key);
  meta.lastAccessed = Date.now();
  metadata.set(key, meta);
  
  return cache.get(key);
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @returns {boolean} - True if value was cached
 */
export function setCache(key, value) {
  if (!isCacheEnabled()) return false;
  
  const type = getCacheType(key);
  const ttl = getTtl(type);
  
  // Don't cache null or undefined values
  if (value === null || value === undefined) return false;
  
  // Check if we need to evict items to stay under max size
  if (cache.size >= CACHE_CONFIG.maxSize) {
    evictOldestItems(type);
  }
  
  cache.set(key, value);
  metadata.set(key, {
    type,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    expiresAt: Date.now() + (ttl * 1000)
  });
  
  logger.debug(`Cached ${type} data for key: ${key.substring(0, 50)}${key.length > 50 ? '...' : ''}`);
  
  return true;
}

/**
 * Evict oldest items of a specific type to make room for new items
 * @param {string} type - Cache type to evict
 */
function evictOldestItems(type) {
  // Get all items of this type
  const items = Array.from(metadata.entries())
    .filter(([_, meta]) => meta.type === type)
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  // Remove oldest 20% of items
  const itemsToRemove = Math.max(1, Math.ceil(items.length * 0.2));
  
  for (let i = 0; i < itemsToRemove && i < items.length; i++) {
    const [key] = items[i];
    cache.delete(key);
    metadata.delete(key);
    logger.debug(`Evicted cache item: ${key.substring(0, 50)}${key.length > 50 ? '...' : ''}`);
  }
}

/**
 * Clear all items from cache
 */
export function clearCache() {
  cache.clear();
  metadata.clear();
  logger.info('Cache cleared');
}

/**
 * Clear expired items from cache
 */
export function clearExpiredCache() {
  const now = Date.now();
  let count = 0;
  
  for (const [key, meta] of metadata.entries()) {
    if (now > meta.expiresAt) {
      cache.delete(key);
      metadata.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    logger.debug(`Cleared ${count} expired cache items`);
  }
}

/**
 * Clear items of a specific type from cache
 * @param {string} type - Cache type to clear
 */
export function clearCacheByType(type) {
  let count = 0;
  
  for (const [key, meta] of metadata.entries()) {
    if (meta.type === type) {
      cache.delete(key);
      metadata.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    logger.info(`Cleared ${count} ${type} cache items`);
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export function getCacheStats() {
  const stats = {
    enabled: isCacheEnabled(),
    totalItems: cache.size,
    byType: {},
    hitRate: 0,
    missRate: 0
  };
  
  // Count items by type
  for (const meta of metadata.values()) {
    stats.byType[meta.type] = (stats.byType[meta.type] || 0) + 1;
  }
  
  return stats;
}

// Set up periodic cache cleanup
if (isCacheEnabled()) {
  // Clear expired items every minute
  setInterval(clearExpiredCache, 60000);
  
  logger.info('Cache initialized', {
    enabled: CACHE_CONFIG.enabled,
    ttlSeconds: CACHE_CONFIG.ttlSeconds,
    maxSize: CACHE_CONFIG.maxSize
  });
}

export default {
  hasCache,
  getCache,
  setCache,
  clearCache,
  clearCacheByType,
  getCacheStats
};
