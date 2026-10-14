import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { fetchPagePreview } from './workers/linkPreview.js';

function linkPreviewDev() {
  return {
    name: 'link-preview',
    configureServer(server) {
      server.middlewares.use('/api/link-preview', (req, res) => {
        const target = new URL(req.url ?? '', 'http://localhost').searchParams.get('url') ?? '';
        fetchPagePreview(target).then((preview) => {
          res.statusCode = preview ? 200 : 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(preview ?? { title: '', image: '', host: '' }));
        }).catch(() => {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ title: '', image: '', host: '' }));
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), linkPreviewDev()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
