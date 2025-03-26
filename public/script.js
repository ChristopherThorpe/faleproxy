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
        
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a valid URL');
            return;
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
            
            // Create a sandboxed iframe to display the content
            const iframe = document.createElement('iframe');
            iframe.sandbox = 'allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation';
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
                
                // Handle link clicks in the iframe
                const links = iframeDocument.querySelectorAll('a');
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
                        const urlObj = new URL(url);
                        fullUrl = `${urlObj.origin}${originalHref}`;
                    } else if (!originalHref.match(/^https?:\/\//)) {
                        // Handle relative URLs without leading slash
                        const urlObj = new URL(url);
                        const path = urlObj.pathname.endsWith('/') ? urlObj.pathname : urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
                        fullUrl = `${urlObj.origin}${path}${originalHref}`;
                    }
                    
                    // Add click event listener
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Fetch the linked page through our proxy
                        urlInput.value = fullUrl;
                        urlForm.dispatchEvent(new Event('submit'));
                    });
                    
                    // Add visual indicator that links are clickable
                    link.style.cursor = 'pointer';
                    link.title = `Click to load: ${fullUrl}`;
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
