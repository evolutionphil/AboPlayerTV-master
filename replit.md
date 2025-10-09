# ASA IPTV - Tizen TV Application

## Overview
This is a Tizen TV IPTV application that provides live TV streaming, movies, series, and other entertainment content. The application is designed for Samsung Tizen TVs and LG WebOS TVs.

## Project Architecture
- **Type**: Static web application (HTML/CSS/JavaScript)
- **Platform**: Originally designed for Tizen TV (Samsung) and WebOS TV (LG)
- **Frontend**: Vanilla JavaScript with jQuery, Bootstrap 4.4.1, Font Awesome icons
- **Server**: Python HTTP server for static file serving

## Recent Changes
- **2025-10-09**: Complete branding update from "Abo" to "ASA"
  - Updated all application titles and branding from "Abo IPTV" to "ASA IPTV"
  - Changed Tizen widget ID from "AboPlayer" to "ASAPlayer"
  - Changed Tizen application ID from "kiSsTUE1Jx.AboPlayer" to "kiSsTUE1Jx.ASAPlayer"
  - Updated all hardcoded URLs from "asaplayer.tv" to "asatv.app"
  - Changed 6 URL references in login/activation messages
  - Renamed workflow from "Abo IPTV Server" to "ASA IPTV Server"
  - Verified no remaining "abo" or "aboxa" references in codebase
  - Architect reviewed and approved with PASS verdict

- **2025-10-09**: Implemented Subtitle Settings Modal with live customization
  - Added live overlay subtitle settings accessible from video player options menu
  - Real-time preview with instant CSS application to actual subtitles during playback
  - Position controls: Up/Down arrows + 4 presets (Bottom 5vh, Middle 20vh, Center 30vh, Upper 40vh)
  - Size controls: 5 levels (14px, 18px, 24px, 32px, 40px) with Smaller/Larger buttons
  - Background controls: 4 options (None/transparent, Black, Red, Green)
  - Auto-save to localStorage for global persistence across all videos
  - Cancel/Revert functionality to restore original settings
  - Button highlighting for active control with blue border focus
  - Integrated into vod_series_player.js with 15 new functions
  - Architect reviewed and approved with PASS verdict

- **2025-10-09**: Implemented local demo playlist fallback system with auto-recovery
  - Added `demoo.m3u` local demo playlist with 58 entries (live channels, movies, series) from flixdemo.com
  - Implemented `fallbackToLocalDemo()` function in login_operation.js for automatic demo mode activation
  - Enhanced network-issue modal with "Continue Anyway (Demo Mode)" button for graceful degradation
  - **Auto-recovery from empty app state**: Enhanced `goBack()` in home_operation.js to detect missing content after Cancel and automatically load demo playlist
  - **Intelligent playlist failure handling**: Enhanced `goHomePageWithPlaylistError()` to automatically fallback to local demo (with demoo.m3u guard to prevent infinite loops)
  - Prevents blank screen scenarios when playlists fail or user cancels reload
  - Toast notification confirms demo mode activation
  - Perfect for trial users and offline capability demonstration
  - Architect reviewed and approved with PASS verdict

- **2025-10-09**: Implemented enhanced subtitle system with API integration
  - Integrated ExoApp.tv API for automatic subtitle fetching
  - Added intelligent episode matching with staged request strategy (TMDB ID → name-based → structure-based)
  - Implemented subtitle.css for customizable subtitle display
  - Added subtitle_fetcher.js for robust API subtitle integration
  - Added enhanced_subtitle_workflow.js for API + native subtitle orchestration
  - Enhanced srt_parser.js with better format correction (handles comma/dot separators)
  - Enhanced srt_operation.js with user customization (position, size, background), better seek handling
  - Integrated EnhancedSubtitleWorkflow into vod_series_player.js
  - User subtitle settings stored in localStorage (position: 0-50vh, size: 5 levels, background: transparent/black/red/green)
  - Automatic fallback from API subtitles to native embedded subtitles

- **2025-09-17**: Successfully imported from GitHub and configured for Replit environment
  - Added Python HTTP server (`server.py`) with CORS support for Replit proxy
  - Configured workflow to serve on port 5000
  - Set up deployment configuration for autoscale
  - Verified all static assets load correctly

## Key Files
- `index.html` - Main application entry point
- `server.py` - Python HTTP server for development/deployment
- `demoo.m3u` - Local demo playlist for offline/trial mode (58 entries)
- `appinfo.json` - Tizen application configuration
- `config.xml` - Tizen widget configuration
- `js/` - JavaScript application logic and libraries
  - `js/login_operation.js` - Login flow with demo fallback functionality
  - `js/subtitle_fetcher.js` - API integration for subtitle fetching
  - `js/enhanced_subtitle_workflow.js` - Subtitle workflow orchestration
  - `js/srt_parser.js` - SRT subtitle format parser
  - `js/srt_operation.js` - Subtitle display timing and customization
  - `js/vod_series_player.js` - Video player with subtitle integration
- `css/` - Stylesheets and UI frameworks
  - `css/subtitle.css` - Subtitle display and customization styling
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