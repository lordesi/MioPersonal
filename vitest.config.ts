import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

// `npm run test`: the plain functions of resources/js/lib, without the build
// plugins of vite.config.ts (the Laravel one refuses to start on CI).
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        include: ['resources/js/**/*.test.ts'],
    },
});
