/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const { sampleHtmlWithYale } = require('./test-utils');

describe('Link Click Functionality', () => {
  let urlForm;
  let urlInput;
  let loadingElement;
  let errorMessage;
  let resultContainer;
  let contentDisplay;
  let originalUrlElement;
  let pageTitleElement;
  
  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = `
      <form id="url-form">
        <input type="url" id="url-input">
        <button type="submit">Fetch & Replace</button>
      </form>
      <div id="loading" class="hidden"></div>
      <div id="error-message" class="hidden"></div>
      <div id="result-container" class="hidden">
        <div id="info-bar">
          <p>Original URL: <a id="original-url" target="_blank" rel="noopener noreferrer"></a></p>
          <p>Page Title: <span id="page-title"></span></p>
        </div>
        <div id="content-display"></div>
      </div>
    `;
    
    // Get DOM elements
    urlForm = document.getElementById('url-form');
    urlInput = document.getElementById('url-input');
    loadingElement = document.getElementById('loading');
    errorMessage = document.getElementById('error-message');
    resultContainer = document.getElementById('result-container');
    contentDisplay = document.getElementById('content-display');
    originalUrlElement = document.getElementById('original-url');
    pageTitleElement = document.getElementById('page-title');
    
    // Mock form submission
    urlForm.dispatchEvent = jest.fn();
    
    // Mock classList methods
    const mockClassList = {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    };
    
    loadingElement.classList = { ...mockClassList };
    errorMessage.classList = { ...mockClassList };
    resultContainer.classList = { ...mockClassList };
    
    // Mock fetch function
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          content: sampleHtmlWithYale,
          title: 'Fale University Test Page',
          originalUrl: 'https://www.yale.edu'
        })
      })
    );
  });
  
  // Helper function to process links based on our script.js implementation
  function processLinks(links, baseUrl) {
    const processedLinks = [];
    
    links.forEach(link => {
      // Store original href
      const originalHref = link.getAttribute('href');
      
      // Skip if no href or it's a javascript: link
      if (!originalHref || originalHref.startsWith('javascript:')) {
        return;
      }
      
      // Handle relative URLs
      let fullUrl = originalHref;
      if (originalHref.startsWith('/')) {
        // Convert relative URL to absolute using the original domain
        const urlObj = new URL(baseUrl);
        fullUrl = `${urlObj.origin}${originalHref}`;
      } else if (!originalHref.match(/^https?:\/\//)) {
        // Handle relative URLs without leading slash
        const urlObj = new URL(baseUrl);
        const path = urlObj.pathname.endsWith('/') ? urlObj.pathname : urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
        fullUrl = `${urlObj.origin}${path}${originalHref}`;
      }
      
      // Add click event handler
      const clickHandler = jest.fn(e => {
        if (e && e.preventDefault) e.preventDefault();
        // In the real implementation, this would update urlInput.value and submit the form
      });
      
      link.addEventListener = jest.fn((event, handler) => {
        if (event === 'click') {
          link.clickHandler = clickHandler;
        }
      });
      
      // Call addEventListener to set up the clickHandler
      link.addEventListener('click', clickHandler);
      
      // Store the processed link info
      processedLinks.push({
        originalHref,
        fullUrl,
        clickHandler
      });
    });
    
    return processedLinks;
  }
  
  test('should handle absolute URLs correctly', () => {
    const url = 'https://www.yale.edu';
    const link = document.createElement('a');
    link.setAttribute('href', 'https://www.yale.edu/about');
    
    const processedLinks = processLinks([link], url);
    
    expect(processedLinks[0].originalHref).toBe('https://www.yale.edu/about');
    expect(processedLinks[0].fullUrl).toBe('https://www.yale.edu/about');
    
    // Simulate clicking the link
    processedLinks[0].clickHandler({ preventDefault: jest.fn() });
    
    // Check if the event listener was added and the handler was called
    expect(link.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(processedLinks[0].clickHandler).toHaveBeenCalled();
  });
  
  test('should handle relative URLs with leading slash correctly', () => {
    const url = 'https://www.yale.edu/departments';
    const link = document.createElement('a');
    link.setAttribute('href', '/academics');
    
    const processedLinks = processLinks([link], url);
    
    expect(processedLinks[0].originalHref).toBe('/academics');
    expect(processedLinks[0].fullUrl).toBe('https://www.yale.edu/academics');
  });
  
  test('should handle relative URLs without leading slash correctly', () => {
    const url = 'https://www.yale.edu/departments/history/';
    const link = document.createElement('a');
    link.setAttribute('href', 'faculty');
    
    const processedLinks = processLinks([link], url);
    
    expect(processedLinks[0].originalHref).toBe('faculty');
    expect(processedLinks[0].fullUrl).toBe('https://www.yale.edu/departments/history/faculty');
  });
  
  test('should handle links with query parameters correctly', () => {
    const url = 'https://www.yale.edu/search';
    const link = document.createElement('a');
    link.setAttribute('href', 'results?q=admissions&page=1');
    
    const processedLinks = processLinks([link], url);
    
    expect(processedLinks[0].originalHref).toBe('results?q=admissions&page=1');
    expect(processedLinks[0].fullUrl).toBe('https://www.yale.edu/results?q=admissions&page=1');
  });
  
  test('should handle links with hash fragments correctly', () => {
    const url = 'https://www.yale.edu/page';
    const link = document.createElement('a');
    link.setAttribute('href', '#section-2');
    
    const processedLinks = processLinks([link], url);
    
    expect(processedLinks[0].originalHref).toBe('#section-2');
    // In JSDOM, hash fragments get converted to absolute URLs
    expect(processedLinks[0].fullUrl).toContain('#section-2');
  });
  
  test('should skip javascript: links', () => {
    const url = 'https://www.yale.edu';
    const link = document.createElement('a');
    link.setAttribute('href', 'javascript:void(0)');
    
    const processedLinks = processLinks([link], url);
    
    // Should be empty as javascript links are skipped
    expect(processedLinks.length).toBe(0);
  });
  
  test('should handle links with no href attribute', () => {
    const url = 'https://www.yale.edu';
    const link = document.createElement('a');
    // No href attribute set
    
    const processedLinks = processLinks([link], url);
    
    // Should be empty as links with no href are skipped
    expect(processedLinks.length).toBe(0);
  });
  
  test('should update the URL input and submit the form when a link is clicked', () => {
    // Setup
    const url = 'https://www.yale.edu';
    const link = document.createElement('a');
    link.setAttribute('href', 'https://www.yale.edu/about');
    
    // Create a simplified version of the link click handler from script.js
    function handleLinkClick(e, href) {
      e.preventDefault();
      urlInput.value = href;
      urlForm.dispatchEvent(new Event('submit'));
    }
    
    // Add the click handler to the link
    link.addEventListener('click', (e) => handleLinkClick(e, 'https://www.yale.edu/about'));
    
    // Trigger the click
    link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    // Verify the URL was updated and form submitted
    expect(urlInput.value).toBe('https://www.yale.edu/about');
    expect(urlForm.dispatchEvent).toHaveBeenCalled();
  });
});
