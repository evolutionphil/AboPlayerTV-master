# ASA IPTV - Tizen TV Application

## Overview
This is a Tizen TV IPTV application that provides live TV streaming, movies, series, and other entertainment content. The application is designed for Samsung Tizen TVs and LG WebOS TVs.

## Project Architecture
- **Type**: Static web application (HTML/CSS/JavaScript)
- **Platform**: Originally designed for Tizen TV (Samsung) and WebOS TV (LG)
- **Frontend**: Vanilla JavaScript with jQuery, Bootstrap 4.4.1, Font Awesome icons
- **Server**: Python HTTP server for static file serving

## Recent Changes
- **2025-10-15**: Implemented Hide Blocked Content Toggle feature for parental controls
  - **Settings Toggle**: Added "Hide Blocked Content" menu item with live ON/OFF indicator
  - **Keyword Filtering**: isContentBlocked() function checks content names against blocked keywords from localStorage
  - **Real-time UI Refresh**: Toggle instantly updates all active views (home, search, channels)
  - **Accurate Category Counts**: Submenus show correct item counts excluding blocked content
  - **Smart Content Filtering**: Applied to showCategoryContent(), changeSortKey(), showCategoryChannels(), and search results
  - **Empty State Handling**: Shows "No items to show" message when all content is blocked in a category
  - **Search Page Optimization**: Refactored keywordChange() → performSearch() + refreshSearch() for forced re-filtering
  - **Toast Notifications**: Visual feedback when toggling ON/OFF
  - **localStorage Persistence**: Setting saved globally across app sessions
  - Architect reviewed and approved with PASS verdict

- **2025-10-15**: Optimized local demo playlist loading logic (ported from LGTV-Master)
  - **Simplified fallbackToLocalDemo()**: Now uses `proceed_login()` infrastructure instead of manual AJAX
  - **Removed code duplication**: Eliminated redundant demo loading logic from home_operation.js goBack()
  - **Better reliability**: Reuses proven login flow instead of custom implementation
  - **Cleaner code**: 60% less code, single source of truth for demo loading
  - Sets `api_host_url = "demoo.m3u"` and calls `proceed_login()` - simple and effective
  - Matches LGTV-Master's exact implementation for consistency

- **2025-10-15**: Fixed aspect ratio functionality for both Samsung Tizen and LG WebOS platforms
  - **Samsung Tizen Enhancement**: Upgraded from 2-mode toggle to 3-mode cycling system
    - Added `aspect_ratio_modes` configuration with 3 modes (Auto, Fit Screen, Fill Screen)
    - Implemented proper cycling through all display modes using `current_aspect_ratio_index`
    - Added toast notifications showing current aspect ratio mode to user
    - Uses Samsung's native `webapis.avplay.setDisplayMethod()` API
  - **LG WebOS Fix**: Implemented complete aspect ratio functionality (was completely broken/empty)
    - Added `aspect_ratio_modes` configuration with 3 CSS object-fit modes (Letterbox, Zoom, Stretch)
    - Implemented cycling through modes using CSS `object-fit` property
    - Added toast notifications showing current aspect ratio mode to user
    - Uses CSS-based approach for video element manipulation
  - **Ported from LGTV-master**: Complete implementation matches the working reference project
  - All modes cycle properly with visual feedback on both platforms

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

- **2025-10-09**: Implemented comprehensive app stability and crash prevention system
  - **Fixed Cancel Button**: Removed data-dismiss conflict in refresh modal (index.html) - Cancel now properly triggers content check
  - **Content Guards**: Added safety checks in channel_operation.js to prevent navigation to empty channels - auto-loads demo if no content
  - **Null Safety**: Enhanced moveScrollPosition in common.js with element/CSS validation - prevents "Cannot read properties of undefined" crashes
  - **TV API Feature Detection**: Added typeof checks for webapis and tizen in main.js - works gracefully in browser and TV environments
  - **Cache Management**: Updated server.py cache headers (no-cache for code, long cache for assets) + version query strings in index.html for reliable updates
  - **Model Access Fix**: Changed from LiveModel.getMovies() to LiveModel.movies property access in home_operation.js
  - Eliminates all "webapis is not defined" errors in browser
  - Prevents app crashes when displaying empty content
  - Demo fallback triggers reliably across all failure scenarios
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