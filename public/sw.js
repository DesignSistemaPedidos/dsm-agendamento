const CACHE_NAME = 'dsm-agendamento-v1';

self.addEventListener('install', (event) => {
    // Skip waiting force o novo service worker a se tornar ativo imediatamente
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Quando ativado, clama controle sobre todos os clientes clientes imediatamente
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Estratégia simples: Stale-While-Revalidate para a maioria das rotas
    // Tenta cache primeiro, mas sempre faz fetch em background para atualizar
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    } else {
        // Para assets estáticos
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
