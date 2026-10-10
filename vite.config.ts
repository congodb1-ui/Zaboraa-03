import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'blueprint-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/generate-blueprint' && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', chunk => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const prompt = body.prompt || '3D isometric enterprise cloud architecture blueprint';
                  const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

                  if (apiKey) {
                    try {
                      const { GoogleGenAI } = await import('@google/genai');
                      const ai = new GoogleGenAI({
                        apiKey,
                        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                      });

                      const imgResp = await ai.models.generateImages({
                        model: 'imagen-3.0-generate-002',
                        prompt,
                        config: {
                          numberOfImages: 1,
                          aspectRatio: '16:9',
                          outputMimeType: 'image/jpeg'
                        }
                      });

                      const imageBase64 = imgResp.generatedImages?.[0]?.image?.imageBytes;
                      if (imageBase64) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          success: true,
                          imageBase64,
                          model: 'imagen-3.0-generate-002',
                          prompt
                        }));
                        return;
                      }
                    } catch (genErr: any) {
                      console.warn('Gemini image generation warning, falling back to bundled asset:', genErr.message);
                    }
                  }

                  // Fallback response with bundled high-res 3D isometric diagram
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    fallback: true,
                    fallbackUrl: '/assets/images/blueprint_3d_isometric_1791610246387.jpg',
                    prompt,
                    message: 'Rendered using bundled high-resolution 3D isometric architecture blueprint.'
                  }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    error: err.message,
                    fallbackUrl: '/assets/images/blueprint_3d_isometric_1791610246387.jpg'
                  }));
                }
              });
              return;
            }

            if (req.url && req.url.startsWith('/src/assets/images/')) {
              req.url = req.url.replace('/src/assets/images/', '/assets/images/');
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
