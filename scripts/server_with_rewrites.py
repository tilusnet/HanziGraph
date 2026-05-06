from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse
import os

BASE_PATH = ''

class RequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        global BASE_PATH
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        if path.endswith('.html'):
            try:
                with open(path, 'rb') as f:
                    content = f.read().replace(b'__BASE_PATH__', BASE_PATH.encode())
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except (FileNotFoundError, OSError):
                self.send_error(404)
        else:
            super().do_GET()

    # mimic firebase hosting's rewrite rules
    def translate_path(self, request_path):
        global BASE_PATH
        request_path = request_path.split('?')[0]
        slashed_path = request_path.removeprefix(BASE_PATH)
        crit_blank = slashed_path in ('/', '')
        crit_specials = any([slashed_path.startswith(f"{candidate}") for candidate in (
            '/simplified', '/traditional', '/cantonese', '/hsk'
        )])
        if crit_blank or crit_specials:
            return 'index.html'
        # now turn the slashed path /foo/bar into ./foo/bar on disk
        path = f".{slashed_path}"
        return path


if __name__ == '__main__':
    # simplified version of answers to
    # https://stackoverflow.com/questions/18624251
    parser = argparse.ArgumentParser(
        description='Enable URL rewrites without relying on firebase hosting. Intended to be run from the public/ directory.')
    parser.add_argument(
        '--port', help='your choice of port; default 8000', nargs='?', default=8000, type=int)
    parser.add_argument(
        '--base-path', help='custom base path, e.g. /app/hanzigraph; useful for reverse proxy', default='')
    args = parser.parse_args()
    port = int(args.port)
    if args.base_path:
        BASE_PATH = args.base_path
        assert BASE_PATH[0] == '/', '--base-path must start with /'
        if BASE_PATH[-1] == '/':
            BASE_PATH = BASE_PATH[:-1]
    myServer = ThreadingHTTPServer(('0.0.0.0', port), RequestHandler)
    print("HanziGraph started")
    try:
        myServer.serve_forever()
    except KeyboardInterrupt:
        pass

    myServer.server_close()
    print("exiting")
