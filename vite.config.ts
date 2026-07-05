import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'crypto'

const proxyCache = new Map<string, string>();

function tuyaProxyPlugin(): Plugin {
  return {
    name: 'tuya-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/tuya')) {
          let bodyText = '';
          req.on('data', (chunk) => {
            bodyText += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const clientId = req.headers['x-tuya-access-id'] as string;
              const clientSecret = req.headers['x-tuya-access-secret'] as string;
              const regionUrl = req.headers['x-tuya-region'] as string;
              const apiPath = req.headers['x-tuya-path'] as string || (req.url || '').substring('/api/tuya'.length);
              const apiMethod = (req.method || 'GET').toUpperCase();
              const accessToken = req.headers['x-tuya-access-token'] as string || '';

              if (!clientId || !clientSecret || !regionUrl || !apiPath) {
                console.warn('[Tuya Proxy] Missing required headers:', { clientId: !!clientId, clientSecret: !!clientSecret, regionUrl, apiPath });
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Missing required Tuya headers' }));
                return;
              }

              const isCacheableGet = apiMethod === 'GET' && (
                apiPath.startsWith('/v1.0/iot-03/device-categories') ||
                (apiPath.startsWith('/v1.0/devices/') && apiPath.endsWith('/functions'))
              );
              const cacheKey = `${clientId}:${apiPath}`;

              if (isCacheableGet && proxyCache.has(cacheKey)) {
                console.log(`[Tuya Proxy] Returning cached response for ${apiPath}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(proxyCache.get(cacheKey));
                return;
              }

              const t = Date.now().toString();
              const nonce = '';
              
              // Calculate body hash
              let bodyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
              if (bodyText && !['GET', 'HEAD'].includes(apiMethod)) {
                bodyHash = crypto.createHash('sha256').update(bodyText).digest('hex');
              }

              // Construct string to sign
              const stringToSign = [
                apiMethod,
                bodyHash,
                '', // Headers (empty)
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

              const headers: Record<string, string> = {
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

              res.writeHead(response.status, { 'Content-Type': 'application/json' });
              res.end(responseText);
            } catch (err: any) {
              console.error('[Tuya Proxy] Error in proxy execution:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/tuya')) {
          let bodyText = '';
          req.on('data', (chunk) => {
            bodyText += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const clientId = req.headers['x-tuya-access-id'] as string;
              const clientSecret = req.headers['x-tuya-access-secret'] as string;
              const regionUrl = req.headers['x-tuya-region'] as string;
              const apiPath = req.headers['x-tuya-path'] as string || (req.url || '').substring('/api/tuya'.length);
              const apiMethod = (req.method || 'GET').toUpperCase();
              const accessToken = req.headers['x-tuya-access-token'] as string || '';

              if (!clientId || !clientSecret || !regionUrl || !apiPath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Missing required Tuya headers' }));
                return;
              }

              const isCacheableGet = apiMethod === 'GET' && (
                apiPath.startsWith('/v1.0/iot-03/device-categories') ||
                (apiPath.startsWith('/v1.0/devices/') && apiPath.endsWith('/functions'))
              );
              const cacheKey = `${clientId}:${apiPath}`;

              if (isCacheableGet && proxyCache.has(cacheKey)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(proxyCache.get(cacheKey));
                return;
              }

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

              const headers: Record<string, string> = {
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
              try {
                const responseJson = JSON.parse(responseText);
                if (isCacheableGet && response.ok && responseJson.success === true) {
                  proxyCache.set(cacheKey, responseText);
                }
              } catch (e) {}

              res.writeHead(response.status, { 'Content-Type': 'application/json' });
              res.end(responseText);
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tuyaProxyPlugin()],
})
