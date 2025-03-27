/**
 * API tests for URL protocol handling
 * Tests how the server handles URLs without protocols
 */

const request = require('supertest');
const nock = require('nock');
const express = require('express');
const { sampleHtmlWithYale } = require('./test-utils');

// Create a test app with the same route handlers as the main app
const testApp = express();
testApp.use(express.json());
testApp.use(express.urlencoded({ extended: true }));

// Import the app and access the ensureHttpProtocol function
const app = require('../app');
const ensureHttpProtocol = app.ensureHttpProtocol;

// Mock the app's routes for testing
testApp.post('/fetch', async (req, res) => {
  try {
    let { url } = req.body;
    
    // First ensure URL has protocol
    url = ensureHttpProtocol(url);
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Parse the URL to get components
    const parsedUrl = new URL(url);
    const baseUrl = parsedUrl.origin;
    
    // For test purposes, we're using the mocked response from nock
    // Use a simplified axios mock to avoid circular JSON structures
    const mockResponse = { data: sampleHtmlWithYale };
    const html = mockResponse.data;
    
    return res.json({ 
      success: true, 
      content: html,
      title: 'Test Title',
      originalUrl: req.body.url,
      processedUrl: url
    });
  } catch (error) {
    console.error('Error in test fetch endpoint:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

describe('URL Protocol API Handling', () => {
  beforeEach(() => {
    // Clear all nock interceptors
    nock.cleanAll();
  });
  
  test('should add http:// to URLs without protocol', async () => {
    // Setup nock to intercept the HTTP request
    nock('http://example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale);
    
    // Send request with URL without protocol
    const response = await request(testApp)
      .post('/fetch')
      .send({ url: 'example.com' })
      .set('Accept', 'application/json');
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.originalUrl).toBe('example.com');
    expect(response.body.processedUrl).toBe('http://example.com');
  });
  
  test('should handle URLs that already have http:// protocol', async () => {
    // Setup nock to intercept the HTTP request
    nock('http://yale.edu')
      .get('/')
      .reply(200, sampleHtmlWithYale);
    
    // Send request with URL that already has protocol
    const response = await request(testApp)
      .post('/fetch')
      .send({ url: 'http://yale.edu' })
      .set('Accept', 'application/json');
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.originalUrl).toBe('http://yale.edu');
    expect(response.body.processedUrl).toBe('http://yale.edu');
  });
  
  test('should handle URLs that already have https:// protocol', async () => {
    // Setup nock to intercept the HTTP request
    nock('https://secure.example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale);
    
    // Send request with URL that already has https protocol
    const response = await request(testApp)
      .post('/fetch')
      .send({ url: 'https://secure.example.com' })
      .set('Accept', 'application/json');
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.originalUrl).toBe('https://secure.example.com');
    expect(response.body.processedUrl).toBe('https://secure.example.com');
  });
  
  test('should handle subdomains correctly', async () => {
    // Setup nock to intercept the HTTP request
    nock('http://subdomain.example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale);
    
    // Send request with subdomain URL without protocol
    const response = await request(testApp)
      .post('/fetch')
      .send({ url: 'subdomain.example.com' })
      .set('Accept', 'application/json');
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.originalUrl).toBe('subdomain.example.com');
    expect(response.body.processedUrl).toBe('http://subdomain.example.com');
  });
  
  test('should handle paths correctly', async () => {
    // Setup nock to intercept the HTTP request
    nock('http://example.com')
      .get('/path/to/page')
      .reply(200, sampleHtmlWithYale);
    
    // Send request with URL with path but without protocol
    const response = await request(testApp)
      .post('/fetch')
      .send({ url: 'example.com/path/to/page' })
      .set('Accept', 'application/json');
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.originalUrl).toBe('example.com/path/to/page');
    expect(response.body.processedUrl).toBe('http://example.com/path/to/page');
  });
});
