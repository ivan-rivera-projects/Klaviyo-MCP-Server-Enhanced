/**
 * JSON Error Handling Test
 * 
 * This script tests the enhanced JSON error handling capabilities
 * by processing intentionally malformed JSON.
 * 
 * Usage: node test-json-error-handling.js
 */

import { sanitizeJson, safeJsonParse } from './src/features/error_handling/json_parser.js';
import logger from './src/utils/logger.js';

// Set up test cases
const testCases = [
  {
    name: 'Missing closing brace',
    input: '{"name": "test", "value": 123',
    expectSuccess: true
  },
  {
    name: 'Unescaped quotes',
    input: '{"name": "test"value", "value": 123}',
    expectSuccess: true
  },
  {
    name: 'Single quotes instead of double quotes',
    input: "{'name': 'test', 'value': 123}",
    expectSuccess: true
  },
  {
    name: 'Trailing comma',
    input: '{"name": "test", "value": 123,}',
    expectSuccess: true
  },
  {
    name: 'Extra content after JSON',
    input: '{"name": "test", "value": 123} extra content',
    expectSuccess: true
  },
  {
    name: 'Missing quotes around property name',
    input: '{name: "test", "value": 123}',
    expectSuccess: true
  },
  {
    name: 'Completely broken structure',
    input: '{name: test" value": 123}}',
    expectSuccess: false
  }
];

// Run the tests
console.log('Testing JSON error handling capabilities\n');

let passCount = 0;
const failedTests = [];

for (const test of testCases) {
  process.stdout.write(`Testing: ${test.name}... `);
  
  // Try to sanitize and parse
  const sanitized = sanitizeJson(test.input);
  let result;
  
  try {
    result = JSON.parse(sanitized);
    
    if (test.expectSuccess) {
      console.log('✅ PASS');
      passCount++;
    } else {
      console.log('❌ FAIL (expected failure but got success)');
      failedTests.push(test.name);
    }
  } catch (error) {
    if (!test.expectSuccess) {
      console.log('✅ PASS (expected failure)');
      passCount++;
    } else {
      console.log('❌ FAIL');
      failedTests.push(test.name);
    }
  }
  
  console.log(`  Original: ${test.input}`);
  console.log(`  Sanitized: ${sanitized}`);
  console.log(`  Result: ${result ? JSON.stringify(result) : 'parsing failed'}\n`);
}

// Report results
console.log(`\nTest Summary: ${passCount}/${testCases.length} tests passed`);

if (failedTests.length > 0) {
  console.log('\nFailed tests:');
  failedTests.forEach(name => console.log(`- ${name}`));
} else {
  console.log('\nAll tests passed! The JSON error handling is working as expected.');
}

// Test safeJsonParse directly
console.log('\nTesting safeJsonParse function...');
for (const test of testCases) {
  const result = safeJsonParse(test.input);
  console.log(`- ${test.name}: ${result ? 'Success' : 'Failed'}`);
}

console.log('\nJSON error handling test complete.');
