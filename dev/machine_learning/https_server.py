from http.server import HTTPServer, SimpleHTTPRequestHandler

HOST = "0.0.0.0"
PORT = 8000

httpd = HTTPServer((HOST, PORT), SimpleHTTPRequestHandler)
print(f"Serving HTTP on http://10.0.0.159:{PORT}")
httpd.serve_forever()