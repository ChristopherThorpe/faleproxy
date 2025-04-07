const axios = require('axios');
const cheerio = require('cheerio');
const { sampleHtmlWithYale } = require('./test-utils');
const nock = require('nock');
const path = require('path');
const { app, startServer, stopServer } = require('../app');
const request = require('supertest');

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 3099;
let server;

describe('Integration Tests', () => {
  beforeAll(async () => {
    // Mock external HTTP requests
    nock.disableNetConnect();
    nock.enableNetConnect(new RegExp(`localhost:${TEST_PORT}|127.0.0.1:${TEST_PORT}`));
    
    // Start the test server with a custom port
    server = startServer(TEST_PORT);
  });

  afterAll(async () => {
    // Stop the test server and clean up
    if (server) {
      await stopServer(server);
    }
    nock.cleanAll();
  });

  test('Should replace Yale with Fale in fetched content', async () => {
    // Mock the external website response
    nock('http://example.com')
      .get('/')
      .reply(200, `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Yale University Test Page</title>
          </head>
          <body>
            <h1>Welcome to Yale University</h1>
            <p>Yale University is a private research university.</p>
            <a href="https://yale.edu">About Yale</a>
          </body>
        </html>
      `);

    // Make a request to our proxy app
    const response = await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
      url: 'http://example.com/'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify Yale has been replaced with Fale in text
    const $ = cheerio.load(response.data.content);
    expect($('title').text()).toBe('Fale University Test Page');
    expect($('h1').text()).toBe('Welcome to Fale University');
    expect($('p').text()).toBe('Fale University is a private research university.');
    
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
        url: 'not-a-valid-url'
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response?.status || error.status).toBe(500);
    }
  });

  test('Should handle missing URL parameter', async () => {
    try {
      await axios.post(`http://localhost:${TEST_PORT}/fetch`, {});
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response?.status || error.status).toBe(400);
      expect(error.response?.data?.error || error.message).toBe('URL is required');
    }
  });
});
