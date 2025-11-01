# ASA IPTV - Tizen TV Application

## Overview
ASA IPTV is a Tizen TV application designed for Samsung Tizen and LG WebOS TVs, providing live TV streaming, movies, series, and other entertainment content. It aims to deliver a comprehensive entertainment experience with a rich, interactive user interface, robust content delivery, and playback capabilities, including local media access and online streaming.

## User Preferences
No specific user preferences recorded yet.

## System Architecture
The application is a static web application built with HTML, CSS, and JavaScript, targeting both Tizen and WebOS TV platforms.

**UI/UX Decisions:**
-   **Branding:** "ASA IPTV" branding across the application.
-   **Responsive Design:** Utilizes Bootstrap 4.4.1 for a consistent and TV-adapted interface.
-   **Iconography:** Font Awesome 5.12.1 for modern icons across menus and player controls.
-   **Modern Design Elements:** Features glass morphism design with dark gradients, purple accents, smooth animations, and custom scrollbars for various components like video info modals, search input, and episode cards.
-   **Theming:** Custom CSS for a cohesive aesthetic across features.
-   **Interaction:** Optimized for TV remote control navigation with clear focus states.

**Technical Implementations & Feature Specifications:**
-   **Content Delivery:** Supports live TV, movies, series, and local storage media (USB/internal).
-   **Live TV Player Bar:** Compact horizontal bar design with integrated channel info, program details, progress bar, and a "LIVE" badge, designed for bottom-centered display.
-   **Local File Browser / USB Storage:** Provides full local media support for TV storage and USB drives using Tizen Filesystem API. Visibility is platform-dependent (hidden on LG WebOS).
-   **YouTube Playlist Integration:** Embeds a YouTube player with playlist support, full TV remote control, auto-play, full-screen toggle, and quality control.
-   **Terms of Use Popup:** Displays on first app launch or version change, requiring acceptance, with multi-language support.
-   **Configurable Featured Content:** A setting to toggle the visibility of the "featured movies" section on the home page.
-   **Parental Controls / Content Blocking:** Comprehensive system using a backend-managed blocklist from `/device_info` API. It filters blocked channels, movies, and series across the UI and prevents playback of restricted content.
-   **Aspect Ratio Functionality:** Supports 3-mode cycling for aspect ratio adjustments using platform-specific APIs (Tizen's `webapis.avplay.setDisplayMethod()` and WebOS's CSS `object-fit`).
-   **Subtitle System:** Implements a robust subtitle system based on the LGTV-Master reference, supporting both Samsung Tizen and LG WebOS. Features include language labels, performance-optimized rendering (document fragments, caching, batch DOM updates), remote control support, and a modern glass morphism right-side panel for live customization (position, size, background). Subtitles are fetched from ExoApp.tv API with fallback to native embedded subtitles.
-   **App Stability & Crash Prevention:** Includes UI locking, debounced `setDisplayArea()` calls, null safety checks, TV capabilities detection, and content guards to prevent crashes and ensure smooth operation.
-   **Player Performance Optimizations:** Utilizes document fragments for faster rendering of episode carousels, deferred initialization, data attributes for O(1) lookups, and GPU-accelerated CSS transitions for smooth control bar animations.
-   **Local Demo Playlist Fallback:** Includes a `demoo.m3u` playlist for offline or trial mode, with automatic activation on network issues.
-   **MAC Address Fallback System:** Implements a multi-tier fallback system for obtaining MAC addresses on both Samsung Tizen and LG WebOS for device identification, following LGTV-Master reference.

**System Design Choices:**
-   **Frontend Framework:** Vanilla JavaScript with jQuery.
-   **Modular Structure:** Organized JavaScript files for distinct functionalities.
-   **State Management:** `localStorage` for user preferences and settings.
-   **Tizen/WebOS Compatibility:** Platform-specific APIs and CSS for cross-platform functionality.
-   **Development Server:** Python HTTP server with CORS support.
-   **Network Error Handling:** Provides options for retry, demo mode, or selecting another playlist upon network failures.
-   **Image Fallbacks:** Automatic fallback to default background images or using poster images as backdrops when API images are unavailable.

## External Dependencies
-   **Libraries:**
    -   jQuery
    -   Bootstrap 4.4.1
    -   Font Awesome
    -   photobox
-   **APIs/Services:**
    -   YouTube IFrame API
    -   ExoApp.tv API (for subtitle fetching)
    -   Tizen Filesystem API (for local storage access on Samsung TVs)
-   **Backend Endpoints:**
    -   `/api/device_info` (for Terms of Use, blocked content lists)
    -   Expected backend API for YouTube playlist data (structure: `{videoId, title, description, thumbnail, duration}`)