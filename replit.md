# Abo IPTV - Tizen TV Application

## Overview
This is a Tizen TV IPTV application that provides live TV streaming, movies, series, and other entertainment content. The application is designed for Samsung Tizen TVs and LG WebOS TVs.

## Project Architecture
- **Type**: Static web application (HTML/CSS/JavaScript)
- **Platform**: Originally designed for Tizen TV (Samsung) and WebOS TV (LG)
- **Frontend**: Vanilla JavaScript with jQuery, Bootstrap 4.4.1, Font Awesome icons
- **Server**: Python HTTP server for static file serving

## Recent Changes
- **2025-09-17**: Successfully imported from GitHub and configured for Replit environment
  - Added Python HTTP server (`server.py`) with CORS support for Replit proxy
  - Configured workflow to serve on port 5000
  - Set up deployment configuration for autoscale
  - Verified all static assets load correctly

## Key Files
- `index.html` - Main application entry point
- `server.py` - Python HTTP server for development/deployment
- `appinfo.json` - Tizen application configuration
- `config.xml` - Tizen widget configuration
- `js/` - JavaScript application logic and libraries
- `css/` - Stylesheets and UI frameworks
- `images/` - Application assets and icons

## Development Setup
The application is served via a Python HTTP server on port 5000. The server includes:
- CORS headers for Replit proxy compatibility
- Cache-control headers to prevent development caching issues
- Static file serving for all application assets

## Deployment
Configured for Replit autoscale deployment using the Python HTTP server to serve static files.

## User Preferences
No specific user preferences recorded yet.