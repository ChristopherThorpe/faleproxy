document.addEventListener('DOMContentLoaded', () => {
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const loadingElement = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');
    const contentDisplay = document.getElementById('content-display');
    const originalUrlElement = document.getElementById('original-url');
    const pageTitleElement = document.getElementById('page-title');

    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a valid URL');
            return;
        }
        
        // Ensure URL has http:// prefix if not already present
        if (!/^https?:\/\//i.test(url)) {
            url = `http://${url}`;
        }
        
        // Show loading indicator
        loadingElement.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        try {
            const response = await fetch('/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch content');
            }
            
            // Update the info bar
            originalUrlElement.textContent = url;
            originalUrlElement.href = url;
            pageTitleElement.textContent = data.title || 'No title';
            
            // Store the base URL for resolving relative links
            const baseUrl = new URL(url).origin;
            
            // Create a sandboxed iframe to display the content
            const iframe = document.createElement('iframe');
            iframe.sandbox = 'allow-same-origin allow-scripts';
            contentDisplay.innerHTML = '';
            contentDisplay.appendChild(iframe);
            
            // Write the modified HTML to the iframe
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            iframeDocument.open();
            iframeDocument.write(data.content);
            iframeDocument.close();
            
            // Adjust iframe height to match content
            iframe.onload = function() {
                iframe.style.height = iframeDocument.body.scrollHeight + 'px';
                
                // Intercept link clicks to handle them within our application
                const links = iframeDocument.querySelectorAll('a');
                links.forEach(link => {
                    // Only modify links with href attributes
                    if (link.href) {
                        // Remove existing click handlers
                        link.removeAttribute('onclick');
                        
                        // Add our custom click handler
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            
                            // Get the link URL and resolve it properly
                            let linkUrl = this.getAttribute('href');
                            
                            // Handle relative URLs
                            if (linkUrl && !linkUrl.match(/^https?:\/\//i)) {
                                // Handle different types of relative URLs
                                if (linkUrl.startsWith('/')) {
                                    // Absolute path relative to domain
                                    linkUrl = baseUrl + linkUrl;
                                } else if (linkUrl.startsWith('#')) {
                                    // Fragment identifier - stay on same page
                                    return;
                                } else {
                                    // Relative path - resolve against current URL
                                    const currentPath = new URL(url).pathname;
                                    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                                    linkUrl = baseUrl + currentDir + linkUrl;
                                }
                            }
                            
                            // Update the URL input field
                            urlInput.value = linkUrl;
                            
                            // Trigger the form submission to load the new page
                            urlForm.dispatchEvent(new Event('submit'));
                        });
                        
                        // Remove target and rel attributes to prevent opening in new tab
                        link.removeAttribute('target');
                        link.removeAttribute('rel');
                    }
                });
            };
            
            // Show result container
            resultContainer.classList.remove('hidden');
        } catch (error) {
            showError(error.message);
        } finally {
            // Hide loading indicator
            loadingElement.classList.add('hidden');
        }
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});
