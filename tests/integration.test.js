const cheerio = require('cheerio');
const request = require('supertest');
const express = require('express');
const { sampleHtmlWithYale } = require('./test-utils');

// Import the ensureHttpProtocol function
const { ensureHttpProtocol } = require('../app');

// Create a test app instead of spawning a server process
const testApp = express();
testApp.use(express.json());
testApp.use(express.urlencoded({ extended: true }));

// Setup the test route handler
testApp.post('/fetch', (req, res) => {
  try {
    let { url } = req.body;
    
    // Ensure URL has protocol
    url = ensureHttpProtocol(url);
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // For testing, we'll use the sample HTML instead of making actual HTTP requests
    const html = sampleHtmlWithYale;
    
    // Use cheerio to parse HTML and replace Yale with Fale
    const $ = cheerio.load(html);
    
    // Process text nodes in the body
    $('body *').contents().filter(function() {
      return this.nodeType === 3; // Text nodes only
    }).each(function() {
      // Replace text content but not in URLs or attributes
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    // Process title separately
    const title = $('title').text().replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
    $('title').text(title);
    
    return res.json({ 
      success: true, 
      content: $.html(),
      title: title,
      originalUrl: url
    });
  } catch (error) {
    console.error('Error in test fetch endpoint:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

describe('Integration Tests', () => {
  test('Should replace Yale with Fale in fetched content', async () => {
    // Make a request to our test app
    const response = await request(testApp)
      .post('/fetch')
      .send({ url: 'https://example.com' })
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify Yale has been replaced with Fale in text
    const $ = cheerio.load(response.body.content);
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
  });

  test('Should handle URLs without protocol', async () => {
    // Make a request to our test app with URL missing protocol
    const response = await request(testApp)
      .post('/fetch')
      .send({ url: 'yale.edu' })
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    // The URL should have http:// added to it
    expect(response.body.originalUrl).toBe('http://yale.edu');
    
    // Content should still be processed correctly
    const content = response.body.content;
    expect(content).toContain('Fale University Test Page');
  });

  test('Should handle missing URL parameter', async () => {
    const response = await request(testApp)
      .post('/fetch')
      .send({})
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });
});
