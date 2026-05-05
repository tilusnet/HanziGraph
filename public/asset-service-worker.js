// TODO: separate caches for code vs data?
const cacheName = 'hanzigraph-7cac44f10125b13c9c0fd59507befd26d563c4a2';
const BASE_PATH = new URL(self.location.href).searchParams.get('basePath') || '';
self.addEventListener('fetch', (e) => {
    if (e.request.method === 'GET' && !e.request.url.includes('firestore')) {
        e.respondWith((async () => {
            const cache = await caches.open(cacheName);
            const r = await cache.match(e.request);
            if (r) {
                return r;
            }
            const response = await fetch(e.request);
            cache.put(e.request, response.clone());
            return response;
        })());
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keyList) =>
            Promise.all(
                keyList.map((key) => {
                    if (key !== cacheName) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

// add code assets to the cache. The user can also indicate they want to make data available offline via postMessage handlers
self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(cacheName).then((cache) =>
        cache.addAll([
            BASE_PATH + "/",
            BASE_PATH + "/index.html",
            BASE_PATH + "/css/hanzi-graph.css",
            // TODO: inline this
            BASE_PATH + "/js/data-load.js",
            // TODO: add to bundle
            BASE_PATH + "/js/external/cytoscape.min.js",
            BASE_PATH + "/manifest.json",
            BASE_PATH + "/js/bundle.js",
            BASE_PATH + "/js/modules/search-suggestions-worker.js",
        ]),
    ),
    );
});

async function checkHasPaths(event) {
    const cache = await caches.open(cacheName);
    const paths = event.data.paths;
    // returns array length 0 on multiple browsers, even when cached?!
    // const matches = await cache.matchAll(paths);
    let result = true;
    for (const path of paths) {
        const whyDoesntMatchAllWork = await cache.match(path);
        if (!whyDoesntMatchAllWork) {
            result = false;
            break;
        }
    }
    event.source.postMessage({
        type: 'checkHasPathsResponse',
        result
    });
}
async function getPaths(event) {
    const cache = await caches.open(cacheName);
    const paths = event.data.paths;
    let result = true;
    try {
        await cache.addAll(paths);
    } catch (e) {
        result = false;
    }
    event.source.postMessage({
        type: 'getPathsResponse',
        result
    });
}

self.addEventListener("message", (event) => {
    if (event.data.type === 'checkHasPaths') {
        checkHasPaths(event);
        return;
    }
    if (event.data.type === 'getPaths') {
        getPaths(event);
        return;
    }
});