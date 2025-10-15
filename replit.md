# ASA IPTV - Tizen TV Application

## Overview
ASA IPTV is a Tizen TV application providing live TV streaming, movies, series, and other entertainment content, designed for Samsung Tizen and LG WebOS TVs. Its purpose is to deliver a comprehensive entertainment experience on smart TV platforms. The project aims for a rich, interactive user interface with robust content delivery and playback capabilities, including local media access and online streaming from various sources.

## User Preferences
No specific user preferences recorded yet.

## System Architecture
The application is a static web application built with HTML, CSS, and JavaScript, designed for both Tizen and WebOS TV platforms.

**UI/UX Decisions:**
-   **Branding:** Updated to "ASA IPTV" across all titles, IDs, and URLs (`asatv.app`).
-   **Responsive Design:** Utilizes Bootstrap 4.4.1 for a consistent look and feel, adapted for TV interfaces.
-   **Iconography:** Employs Font Awesome for a rich set of icons.
-   **Theming:** Custom CSS (`youtube.css`, `storage_page.css`, `subtitle.css`) ensures a cohesive aesthetic throughout different features.
-   **Interaction:** Optimized for TV remote control navigation with clear focus states and intuitive button mapping (UP/DOWN, LEFT/RIGHT, ENTER, RETURN).

**Technical Implementations & Feature Specifications:**
-   **Content Delivery:** Supports live TV, movies, and series.
-   **Local File Browser / USB Storage:** Enables browsing internal TV storage and external USB drives.
    -   Uses Tizen Filesystem API (`tizen.filesystem.listStorages()`, `resolve()`) for real device enumeration.
    -   **Platform Visibility:** Storage Play menu is hidden on LG WebOS (class `not-lg`) as LG doesn't support Tizen Filesystem API.
    -   Automatic file type detection (video, image) and directory navigation.
    -   Playback of local video files via `vod_series_player` and image viewing via `image_page` with photobox.
-   **YouTube Playlist Integration:** Embeds YouTube player with playlist support.
    -   Full TV remote control, auto-play next video, full-screen toggle, quality control, and error handling.
    -   Expects playlist data from a backend API.
-   **Terms of Use Popup:** Displays on first app launch or version change, requiring acceptance.
    -   Fetches terms from `/api/device_info` and stores acceptance in `localStorage`.
    -   Multi-language support.
-   **Hide Blocked Content:** Parental control feature to filter content based on keywords.
    -   Settings toggle with real-time UI refresh across all views (home, search, channels).
    -   Persistence via `localStorage`.
-   **Aspect Ratio Functionality:**
    -   **Samsung Tizen:** 3-mode cycling (Auto, Fit Screen, Fill Screen) using `webapis.avplay.setDisplayMethod()`.
    -   **LG WebOS:** 3-mode cycling (Letterbox, Zoom, Stretch) using CSS `object-fit`.
-   **Subtitle System:**
    -   **Live Customization:** Overlay subtitle settings (position, size, background) accessible during playback with real-time preview.
    -   **API Integration:** Fetches subtitles from ExoApp.tv API with intelligent episode matching and fallback to native embedded subtitles.
    -   SRT parsing with format correction.
    -   User settings are stored in `localStorage`.
-   **App Stability & Crash Prevention:**
    -   Content guards to prevent navigation to empty channels.
    -   Null safety checks for UI elements.
    -   TV API feature detection (`typeof webapis` and `tizen`).
    -   Cache management for reliable updates.
-   **Local Demo Playlist Fallback:**
    -   Includes `demoo.m3u` for offline/trial mode.
    -   Automatic demo mode activation on network issues or content failure.
    -   Graceful degradation with "Continue Anyway (Demo Mode)" option.
-   **MAC Address Fallback System:**
    -   **Samsung Tizen:** 4-tier fallback (Ethernet → DUID → Tizen ID → Hardcoded)
        -   Primary: Ethernet MAC via `tizen.systeminfo.getPropertyValue('ETHERNET_NETWORK')`
        -   Secondary: DUID (Base64 encoded, converted to MAC format)
        -   Tertiary: Tizen ID (Base64 encoded, converted to MAC format)
        -   Final: Hardcoded MAC `52:54:00:12:34:59`
    -   **LG WebOS:** 3-tier fallback (LGUDID → Ethernet → Hardcoded)
        -   Primary: LGUDID via `luna://com.webos.service.sm`
        -   Secondary: Ethernet MAC via `luna://com.webos.service.connectionmanager`
        -   Final: Hardcoded MAC `52:54:00:12:34:59`
    -   Helper function `stringToMacAddress()` converts device IDs to MAC format
    -   Network error modal displays MAC address for troubleshooting
    -   Implementation follows LGTV-Master reference for reliability

**System Design Choices:**
-   **Frontend Framework:** Vanilla JavaScript with jQuery for DOM manipulation.
-   **Modular Structure:** Logic is organized into distinct JavaScript files (e.g., `login_operation.js`, `home_operation.js`, `youtube_page.js`, `storage_operation.js`, `vod_series_player.js`).
-   **State Management:** `localStorage` is used for persisting user preferences, terms acceptance, and settings (e.g., blocked content, subtitle settings).
-   **Tizen/WebOS Compatibility:** Specific platform-dependent APIs and CSS approaches are used to ensure functionality across both TV operating systems.
-   **Development Server:** A Python HTTP server (`server.py`) with CORS support and socket reuse enabled for reliable workflow restarts.
-   **Network Error Handling:** When playlists fail to load, the network error modal appears with options to Retry, Continue with Demo Mode, or Choose Another Playlist (if multiple available). RETURN key provides quick access to demo mode.

## External Dependencies
-   **Libraries:**
    -   jQuery
    -   Bootstrap 4.4.1
    -   Font Awesome
    -   photobox (for image gallery)
-   **APIs/Services:**
    -   YouTube IFrame API (for embedded video playback)
    -   ExoApp.tv API (for subtitle fetching)
    -   Tizen Filesystem API (for local storage access on Samsung TVs)
-   **Backend Endpoints:**
    -   `/api/device_info` (to fetch Terms of Use)
    -   Expected backend API for YouTube playlist data (structure: `{videoId, title, description, thumbnail, duration}`)