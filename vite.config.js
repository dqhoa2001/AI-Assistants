import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/css/chat.css',
                'resources/css/qa.css',
                'resources/css/integraflow.css',
                'resources/js/app.js',
                'resources/js/chat.js',
                'resources/js/qa.js',
                'resources/js/integraflow.js'
            ],
            refresh: true,
        }),
    ],
    resolve: {
        alias: {
            // Thêm alias nếu cần
        },
    },
    optimizeDeps: {
        include: ['marked', 'dompurify']
    }
});
