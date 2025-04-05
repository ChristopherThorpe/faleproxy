const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { sampleHtmlWithYale } = require('./test-utils');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 3099;
const MOCK_SERVER_PORT = 3098;
let server;
let mockServer;

describe('Integration Tests', () => {
  // Modify the app to use a test port and set up a mock server
  beforeAll(async () => {
    // Create a mock server to serve the sample HTML
    const mockApp = express();
    mockApp.get('/', (req, res) => {
      res.send(sampleHtmlWithYale);
    });
    
    // Start the mock server
    mockServer = mockApp.listen(MOCK_SERVER_PORT, () => {
      console.log(`Mock server running at http://localhost:${MOCK_SERVER_PORT}`);
    });
    
    // Create a temporary test app file
    await execAsync('cp app.js app.test.js');
    await execAsync(`sed -i '' 's/const PORT = 3001/const PORT = ${TEST_PORT}/' app.test.js`);
    
    // Start the test server
    server = require('child_process').spawn('node', ['app.test.js'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, 15000); // Increase timeout for server startup

  afterAll(async () => {
    // Kill the test server and clean up
    if (server && server.pid) {
      process.kill(-server.pid);
    }
    
    // Close the mock server
    if (mockServer) {
      mockServer.close();
    }
    
    await execAsync('rm app.test.js');
  });

  test('Should replace Yale with Fale in fetched content', async () => {
    // Make a request to our proxy app, pointing to our mock server
    const response = await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
      url: `http://localhost:${MOCK_SERVER_PORT}/`
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify Yale has been replaced with Fale in text
    const $ = cheerio.load(response.data.content);
    expect($('title').text()).toBe('Fale University Test Page');
    expect($('h1').text()).toBe('Welcome to Fale University');
    expect($('p').first().text()).toContain('Fale University is a private');
    
    // Verify URLs remain unchanged
    const links = $('a');
    let hasYaleUrl = false;
    links.each((i, link) => {
      const href = $(link).attr('href');
      if (href && href.includes('yale.edu')) {
        hasYaleUrl = true;
      }
    });
    expect(hasYaleUrl).toBe(true);
    
    // Verify link text is changed
    expect($('a').first().text()).toBe('About Fale');
  }, 10000); // Increase timeout for this test

  test('Should handle invalid URLs', async () => {
    try {
      await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
        url: 'https://not-a-valid-url'
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response).toBeDefined();
      if (error.response) {
        expect(error.response.status).toBe(500);
      }
    }
  });

  test('Should handle missing URL parameter', async () => {
    try {
      await axios.post(`http://localhost:${TEST_PORT}/fetch`, {});
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response).toBeDefined();
      if (error.response) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('URL is required');
      }
    }
  });
});
