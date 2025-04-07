const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { sampleHtmlWithYale } = require('./test-utils');
const nock = require('nock');

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 3099;
let server;

describe('Integration Tests', () => {
  // Modify the app to use a test port
  beforeAll(async () => {
    // Mock external HTTP requests
    nock.disableNetConnect();
    nock.enableNetConnect(new RegExp(`localhost:${TEST_PORT}|127.0.0.1:${TEST_PORT}`));
    
    // Start the test server with a custom port
    process.env.PORT = TEST_PORT;
    server = require('child_process').spawn('node', ['app.js'], {
      env: { ...process.env },
      stdio: 'ignore'
    });
    
    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, 10000); // Increase timeout for server startup

  afterAll(async () => {
    // Kill the test server and clean up
    if (server) {
      server.kill();
    }
    delete process.env.PORT;
    jest.resetAllMocks();
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
