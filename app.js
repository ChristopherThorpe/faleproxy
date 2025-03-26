const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to ensure URL has http protocol
function ensureHttpProtocol(url) {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) {
    return `http://${url}`;
  }
  return url;
}

// Export for testing
module.exports = { ensureHttpProtocol };

// API endpoint to fetch and modify content
app.post('/fetch', async (req, res) => {
  try {
    let { url } = req.body;
    
    // First ensure URL has protocol
    url = ensureHttpProtocol(url);
    
    // Then validate URL is not empty
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Parse the URL to get components
    const parsedUrl = new URL(url);
    const baseUrl = parsedUrl.origin;

    // Fetch the content from the provided URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const html = response.data;

    // Use cheerio to parse HTML and selectively replace text content, not URLs
    const $ = cheerio.load(html);
    
    // Add base tag to handle relative URLs correctly
    if (!$('head base').length) {
      $('head').prepend(`<base href="${baseUrl}/" />`);
    }
    
    // Function to replace text but skip URLs and attributes
    function replaceYaleWithFale(i, el) {
      if ($(el).children().length === 0 || $(el).text().trim() !== '') {
        // Get the HTML content of the element
        let content = $(el).html();
        
        // Only process if it's a text node
        if (content && $(el).children().length === 0) {
          // Replace Yale with Fale in text content only
          content = content.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
          $(el).html(content);
        }
      }
    }
    
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
      originalUrl: req.body.url
    });
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({ 
      error: `Failed to fetch content: ${error.message}` 
    });
  }
});

// Only start the server if this file is run directly (not imported for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Faleproxy server running at http://localhost:${PORT}`);
  });
}
