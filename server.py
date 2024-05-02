from http.server import BaseHTTPRequestHandler, HTTPServer
import socketserver


class MyRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Welcome to the root index!</h1>')
        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'404 Not Found')


def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, MyRequestHandler)
    print('Server running on http://localhost:8000')
    httpd.serve_forever()


if __name__ == '__main__':
    run_server()
    import http.server

    class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            super().end_headers()

    def run_server():
        PORT = 8000
        Handler = MyRequestHandler

        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Server running on http://localhost:{PORT}")
            httpd.serve_forever()

    if __name__ == "__main__":
        run_server()
