# Faleproxy

A Node.js web application that fetches a URL, replaces every instance of "Yale" with "Fale" in the document, and displays the modified content.

## Submission notes

- This took me approximately 2 hours to complete
- I 

## Features

- Simple and intuitive user interface
- Fetches web content from any URL
- Replaces all instances of "Yale" with "Fale" (case-insensitive)
- Displays the modified content in an iframe
- Shows original URL and page title in an info bar
- Allows users to enter a link without the protocol (e.g., yale.edu)
- Handles relative links and navigation within the application

## Installation

1. Clone this repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Usage

1. Start the server:

```bash
npm start
```

2. Open a browser and go to `http://localhost:3001`
3. Enter a URL in the input field (e.g., https://www.yale.edu)
4. Click "Fetch & Replace" to see the modified content

## Development

To run with auto-restart on file changes:

```bash
npm run dev
```

## Testing

The application includes a comprehensive test suite:

- **Unit tests**: Test the Yale-to-Fale replacement logic
- **API tests**: Test the application endpoints
- **Integration tests**: Test the entire application workflow
- **URL Handling tests**: Verify automatic addition of HTTP protocol to URLs
- **Navigation tests**: Ensure proper handling of relative and absolute URLs when navigating
- **URL API tests**: Validate API behavior with different URL formats

## Deployment to Vercel

This application is configured for deployment to Vercel's serverless environment:

1. **Push your code to GitHub**

2. **Connect to Vercel**:
   - Sign in to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository and click "Import"

3. **Configure the project**:
   - The default settings will work automatically due to the `vercel.json` configuration
   - No environment variables are required for basic functionality

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

5. **Access your deployed application**:
   - Once deployment is complete, you can access your application at the provided Vercel URL

### Important Code Structure

The application has been structured to work in both local and serverless environments:

- **Function Exports**: The `ensureHttpProtocol` function is exported as a property of the app object
- **Resource Paths**: All resource paths use absolute URLs (starting with `/`)
- **Error Handling**: Comprehensive error handling for all API endpoints

### Troubleshooting Vercel Deployment

If you encounter issues with your Vercel deployment:

1. **Check the Build Logs** in the Vercel dashboard for any errors
2. **Verify Static Assets** are being served correctly by checking network requests
3. **Check Browser Console** for any JavaScript errors
4. **Test API Endpoints** directly to isolate any issues

### Test Files

The application includes the following test files:

- **`tests/unit.test.js`**: Tests the core text replacement functionality
- **`tests/api.test.js`**: Tests the main API endpoint functionality
- **`tests/integration.test.js`**: Tests the complete application flow with mocked responses
- **`tests/url-handling.test.js`**: Tests the automatic HTTP protocol addition to URLs
- **`tests/navigation.test.js`**: Tests URL resolution for both relative and absolute paths
- **`tests/url-api.test.js`**: Tests API handling of different URL formats and edge cases

The tests use Jest as the testing framework and include mocks for external dependencies to avoid making actual HTTP requests during testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage for CI/CD
npm run test:ci
```

## CI/CD Pipeline

The repository includes a GitHub Actions workflow configuration in `.github/workflows/ci.yml` that:

1. Runs on pushes to main/master branches and on pull requests
2. Tests the application on multiple Node.js versions (18.x, 20.x)
3. Generates and uploads test coverage reports
4. Automatically deploys to Vercel (when pushing to main/master)

### Setting up Vercel Deployment

To enable automatic deployments to Vercel, you need to:

1. Create a Vercel account and link your repository
2. Create a Vercel project for your application
3. Generate a Vercel token and add it as a secret in your GitHub repository:
   - Go to Settings → Secrets → Actions
   - Add a new secret named `VERCEL_TOKEN` with your Vercel token

## Technologies Used

- Node.js
- Express - Web server framework
- Axios - HTTP client for fetching web pages
- Cheerio - HTML parsing and manipulation
- Vanilla JavaScript for frontend functionality
- Jest, Supertest, and Nock for testing
