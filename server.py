import http.server
import socketserver
import urllib.parse
import sys
import json
import logging
from datetime import datetime
import socket

# Configuration
PORT = 3001  # Port the server runs on
ALLOWED_ORIGIN = "https://mail1.cselab.nitrkl.in"  # Configurable allowed origin for CORS

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
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        # Additional security headers
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy", "default-src 'none'")

    def do_GET(self):
        """Handle GET requests to log query parameters and send a response."""
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)

            # Log received query parameters
            if query_params:
                logger.info(f"Received GET data: {query_params}")
            else:
                logger.info("Received GET request with no query parameters")

            # Send success response
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_cors_headers()
            self.end_headers()

            # Prepare response
            response = {
                "status": "success",
                "message": "Data received",
                "received_data": query_params
            }
            try:
                self.wfile.write(json.dumps(response).encode('utf-8'))
                self.wfile.flush()
            except BrokenPipeError:
                logger.warning("Client closed connection early (BrokenPipeError)")
            except Exception as e:
                logger.error(f"Error writing response: {e}")

        except Exception as e:
            logger.error(f"Error processing GET request: {e}")
            self.send_response(500)
            self.send_header("Content-type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            response = {"status": "error", "message": f"Server error: {str(e)}"}
            self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_POST(self):
        """Handle POST requests to receive and log email data."""
        try:
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0:
                logger.warning("No data received in POST request")
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                response = {"status": "error", "message": "No data provided"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

            # Read and parse POST data
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                email = data.get('email', 'No email provided')
                logger.info(f"Received POST email: {email}")

                # Send success response
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                response = {"status": "success", "message": "Email data received", "email": email}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except json.JSONDecodeError:
                logger.warning("Invalid JSON data received")
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                response = {"status": "error", "message": "Invalid JSON data"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                logger.error(f"Error processing POST data: {e}")
                self.send_response(500)
                self.send_header("Content-type", "application/json")
                self.send_cors_headers()
                self.end_headers()
                response = {"status": "error", "message": f"Server error: {str(e)}"}
                self.wfile.write(json.dumps(response).encode('utf-8'))

        except Exception as e:
            logger.error(f"Error handling POST request: {e}")
            self.send_response(500)
            self.send_header("Content-type", "application/json")
            self.send_cors_headers()
            self.end_headers()
            response = {"status": "error", "message": f"Server error: {str(e)}"}
            self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        try:
            self.send_response(200)
            self.send_cors_headers()
            self.end_headers()
            logger.info("Handled OPTIONS preflight request")
        except Exception as e:
            logger.error(f"Error handling OPTIONS request: {e}")
            self.send_response(500)
            self.send_cors_headers()
            self.end_headers()

    def log_message(self, format, *args):
        """Override default logging to use custom logger."""
        # Use logger instead of default print
        logger.info(f"Request: {format % args}")

def check_port(port):
    """Check if the specified port is available."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("", port))
            return True
        except socket.error:
            return False

def run_server():
    """Start the HTTP server."""
    try:
        if not check_port(PORT):
            logger.error(f"Port {PORT} is already in use. Please free the port or choose another.")
            sys.exit(1)

        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            logger.info(f"Server running on port {PORT}")
            logger.info(f"Listening at http://localhost:{PORT}")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                logger.info("Server stopped by user (Ctrl+C)")
                httpd.server_close()
                sys.exit(0)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()