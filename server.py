#!/usr/bin/env python3
"""
Simple HTTP server for serving the Tizen TV IPTV application
Configured for Replit environment with proper CORS and host headers
"""

import http.server
import socketserver
import os
from urllib.parse import unquote

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Request Handler with CORS support for Replit proxy"""
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        # Allow all origins (required for Replit proxy)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        
        # Disable caching for development (critical for Replit)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom logging format"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server():
    """Start the HTTP server"""
    PORT = 5000
    
    # Change to the directory containing the web files
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("0.0.0.0", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"Serving Abo IPTV application at http://0.0.0.0:{PORT}")
        print(f"Files being served from: {os.getcwd()}")
        print("Server is ready for connections...")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()