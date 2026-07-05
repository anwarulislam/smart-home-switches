import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

app.use(express.text({ type: 'application/json' }));
app.use(express.text({ type: 'text/plain' }));

// In-memory cache for static API responses (device categories, device functions)
const proxyCache = new Map();

// API Proxy Endpoint
app.all('/api/tuya*', async (req, res) => {
  try {
    const clientId = req.headers['x-tuya-access-id'];
    const clientSecret = req.headers['x-tuya-access-secret'];
    const regionUrl = req.headers['x-tuya-region'];
    const apiPath = req.headers['x-tuya-path'] || (req.originalUrl || req.url).substring('/api/tuya'.length);
    const apiMethod = (req.method || 'GET').toUpperCase();
    const accessToken = req.headers['x-tuya-access-token'] || '';

    if (!clientId || !clientSecret || !regionUrl || !apiPath) {
      console.warn('[Tuya Proxy] Missing required headers:', { clientId: !!clientId, clientSecret: !!clientSecret, regionUrl, apiPath });
      return res.status(400).json({ success: false, error: 'Missing required Tuya headers' });
    }

    const isCacheableGet = apiMethod === 'GET' && (
      apiPath.startsWith('/v1.0/iot-03/device-categories') ||
      (apiPath.startsWith('/v1.0/devices/') && apiPath.endsWith('/functions'))
    );
    const cacheKey = `${clientId}:${apiPath}`;

    if (isCacheableGet && proxyCache.has(cacheKey)) {
      console.log(`[Tuya Proxy] Returning cached response for ${apiPath}`);
      return res.status(200).set('Content-Type', 'application/json').send(proxyCache.get(cacheKey));
    }

    const bodyText = req.body || '';

    const t = Date.now().toString();
    const nonce = '';
    
    let bodyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    if (bodyText && !['GET', 'HEAD'].includes(apiMethod)) {
      bodyHash = crypto.createHash('sha256').update(bodyText).digest('hex');
    }

    const stringToSign = [
      apiMethod,
      bodyHash,
      '',
      apiPath
    ].join('\n');

    const signStr = accessToken
      ? clientId + accessToken + t + nonce + stringToSign
      : clientId + t + nonce + stringToSign;

    const sign = crypto
      .createHmac('sha256', clientSecret)
      .update(signStr)
      .digest('hex')
      .toUpperCase();

    const url = new URL(apiPath, regionUrl).toString();

    console.log(`[Tuya Proxy] Forwarding ${apiMethod} ${apiPath} to Region: ${regionUrl}`);
    if (accessToken) {
      console.log(`[Tuya Proxy] Request includes access_token: ${accessToken.substring(0, 8)}...`);
    } else {
      console.log(`[Tuya Proxy] Request is for token acquisition (no access_token)`);
    }

    const headers = {
      'client_id': clientId,
      'sign': sign,
      't': t,
      'sign_method': 'HMAC-SHA256',
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['access_token'] = accessToken;
    }

    const response = await fetch(url, {
      method: apiMethod,
      headers,
      body: ['GET', 'HEAD'].includes(apiMethod) ? undefined : (bodyText || undefined),
    });

    const responseText = await response.text();
    console.log(`[Tuya Proxy] Response status: ${response.status} from Tuya`);
    try {
      const responseJson = JSON.parse(responseText);
      if (responseJson.success === false) {
        console.error(`[Tuya Proxy] Tuya returned error code ${responseJson.code}: "${responseJson.msg}"`);
      } else if (isCacheableGet && response.ok && responseJson.success === true) {
        proxyCache.set(cacheKey, responseText);
        console.log(`[Tuya Proxy] Cached response for ${apiPath}`);
      }
    } catch (e) {}

    res.status(response.status).set('Content-Type', 'application/json').send(responseText);
  } catch (err) {
    console.error('[Tuya Proxy] Error in proxy execution:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
