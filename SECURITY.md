# Security

PaperVault is designed with security and privacy as the fundamental priorities.

## 1. Zero Data Egress
PaperVault does not have a backend server. All files, metadata, and filenames remain entirely on the client device.

## 2. No Analytics
We do not use tracking pixels, analytics suites (Google Analytics, Mixpanel, etc.), or crash reporters that could inadvertently leak filenames or document characteristics.

## 3. Secure File Handling
- **MIME Type Validation**: All files are strictly validated before processing.
- **Memory Safety**: Object URLs are aggressively revoked to prevent memory leaks.
- **Sandboxed Workers**: All processing occurs in Web Workers, isolating the main UI thread.

## 4. No Remote Scripts
The application is designed to be fully functional offline. It does not load external fonts or scripts that could track users.

## 5. Security Vulnerabilities
If you discover a security vulnerability, please report it via GitHub Issues or contact the maintainer directly.
