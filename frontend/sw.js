// AI-Trainer Service Worker
// Provides offline functionality and caching for the training interface

const CACHE_NAME = 'ai-trainer-v1.2.0';
const STATIC_CACHE = 'ai-trainer-static-v1';
const API_CACHE = 'ai-trainer-api-v1';

// Files to cache for offline use (only local files)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/TrainingDashboard.js',
  '/src/TrainingDashboard.css'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/training/health',
  '/training/',
  '/training/analytics'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🤖 AI-Trainer SW: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 SW: Caching static files');
        // Cache only local files, skip external CDNs to avoid CSP issues
        const localFiles = STATIC_FILES.filter(file => !file.startsWith('https://'));
        return cache.addAll(localFiles);
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('📊 SW: Initializing API cache');
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('✅ SW: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 AI-Trainer SW: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ SW: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external CDNs - let them pass through normally
  if (url.hostname !== location.hostname) {
    console.log('🌐 SW: Skipping external URL:', url.href);
    return; // Don't intercept external requests
  }
  
  // Handle different types of requests (only for same origin)
  if (url.pathname.startsWith('/training/')) {
    // API requests - Network First strategy
    event.respondWith(handleAPIRequest(request));
  } else if (STATIC_FILES.some(file => url.pathname === file)) {
    // Static files - Cache First strategy (only local files)
    event.respondWith(handleStaticRequest(request));
  } else {
    // Other requests - Network First with fallback
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('📡 SW: Network failed for API request:', url.pathname);
    
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 SW: Serving cached API response:', url.pathname);
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    if (url.pathname === '/training/health') {
      return new Response(JSON.stringify({
        success: false,
        status: 'offline',
        service: 'AI-Trainer Training Interface',
        message: 'Service temporarily unavailable (offline mode)'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/training/') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Dashboard unavailable in offline mode',
        stats: {
          totalSamples: 0,
          businessTypes: 0,
          avgQualityScore: 0,
          lastCollection: null
        },
        recentSamples: [],
        systemStatus: {
          dataCollector: 'offline',
          aiAnalysis: 'offline',
          storage: 'unavailable'
        }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generic offline response
    return new Response(JSON.stringify({
      success: false,
      error: 'Service unavailable offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static requests with Cache First strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fall back to network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('📦 SW: Failed to serve static file:', request.url);
    
    // Return offline page for HTML requests
    if (request.destination === 'document') {
      return getOfflinePage();
    }
    
    // Return empty response for other static files
    return new Response('', { status: 404 });
  }
}

// Handle other requests with Network First strategy
async function handleOtherRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return getOfflinePage();
    }
    
    // Return error for other requests
    return new Response('Offline', { status: 503 });
  }
}

// Generate offline page
function getOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🤖 AI-Trainer - Offline</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: linear-gradient(135deg, #667EEA, #764BA2);
                color: white;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                text-align: center;
            }
            .offline-container {
                max-width: 500px;
                padding: 2rem;
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: bounce 2s infinite;
            }
            h1 { margin: 1rem 0; }
            p { opacity: 0.9; margin: 1rem 0; }
            .retry-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 1rem;
                transition: all 0.3s ease;
            }
            .retry-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            .status-info {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1.5rem;
                font-size: 0.875rem;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📡</div>
            <h1>AI-Trainer Offline</h1>
            <p>
                La connessione al sistema AI-Trainer non è disponibile al momento.
                Verifica la connessione internet e riprova.
            </p>
            <button class="retry-btn" onclick="window.location.reload()">
                🔄 Riprova Connessione
            </button>
            <div class="status-info">
                <strong>Modalità Offline Attiva</strong><br>
                Alcune funzionalità potrebbero non essere disponibili.<br>
                I dati cached sono comunque accessibili.
            </div>
        </div>
        
        <script>
            // Auto-retry connection every 30 seconds
            setInterval(() => {
                if (navigator.onLine) {
                    fetch('/training/health')
                        .then(response => {
                            if (response.ok) {
                                window.location.reload();
                            }
                        })
                        .catch(() => {
                            // Still offline
                        });
                }
            }, 30000);
            
            // Listen for online events
            window.addEventListener('online', () => {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });
        </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'ai-trainer-sync') {
    console.log('🔄 SW: Background sync triggered');
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Retry failed API requests
    const cache = await caches.open(API_CACHE);
    const cachedRequests = await cache.keys();
    
    for (const request of cachedRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.warn('🔄 SW: Background sync failed for:', request.url);
      }
    }
    
    console.log('✅ SW: Background sync completed');
  } catch (error) {
    console.error('❌ SW: Background sync error:', error);
  }
}

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Aggiornamento AI-Trainer disponibile',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'ai-trainer-notification',
      data: data.url || '/',
      actions: [
        {
          action: 'open',
          title: 'Apri Dashboard'
        },
        {
          action: 'close',
          title: 'Chiudi'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'AI-Trainer', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('🤖 AI-Trainer Service Worker loaded successfully');
console.log('📋 Cache version:', CACHE_NAME);
console.log('📦 Static files to cache:', STATIC_FILES.length);
console.log('📊 API endpoints monitored:', API_ENDPOINTS.length);
