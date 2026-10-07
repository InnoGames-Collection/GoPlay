import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3303;
const API_URL = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'http://goplay-api:3302' : 'http://127.0.0.1:3302');

// Transparent API Proxy fallback if Nginx is bypassed
app.use('/api', (req, res) => {
  const targetUrl = new URL(req.url, API_URL + '/api');
  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('[Admin Express Proxy Error]', err.message);
    res.status(502).json({ success: false, error: 'Bad Gateway: Could not reach GoPlay API.' });
  });

  req.pipe(proxyReq);
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'goplay-admin', version: '1.0.0' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GoPlay Admin Console running on port ${PORT}`);
});
