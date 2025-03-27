// Import the app which has ensureHttpProtocol as a property
const app = require('../app');
// Access the ensureHttpProtocol function directly from the app object
const ensureHttpProtocol = app.ensureHttpProtocol;

describe('URL Protocol Handling', () => {
  test('should add http:// to URLs without protocol', () => {
    expect(ensureHttpProtocol('example.com')).toBe('http://example.com');
    expect(ensureHttpProtocol('yale.edu')).toBe('http://yale.edu');
    expect(ensureHttpProtocol('subdomain.example.com')).toBe('http://subdomain.example.com');
    expect(ensureHttpProtocol('example.com/path/to/page')).toBe('http://example.com/path/to/page');
    expect(ensureHttpProtocol('example.com?param=value')).toBe('http://example.com?param=value');
  });

  test('should not modify URLs that already have http:// protocol', () => {
    expect(ensureHttpProtocol('http://example.com')).toBe('http://example.com');
    expect(ensureHttpProtocol('http://yale.edu')).toBe('http://yale.edu');
    expect(ensureHttpProtocol('http://example.com/path')).toBe('http://example.com/path');
  });

  test('should not modify URLs that already have https:// protocol', () => {
    expect(ensureHttpProtocol('https://example.com')).toBe('https://example.com');
    expect(ensureHttpProtocol('https://yale.edu')).toBe('https://yale.edu');
    expect(ensureHttpProtocol('https://example.com/secure')).toBe('https://example.com/secure');
  });

  test('should handle edge cases', () => {
    expect(ensureHttpProtocol('')).toBe('');
    expect(ensureHttpProtocol('localhost:3000')).toBe('http://localhost:3000');
    expect(ensureHttpProtocol('127.0.0.1:8080')).toBe('http://127.0.0.1:8080');
  });
});
