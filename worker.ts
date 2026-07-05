import crypto from 'node:crypto';

interface Env {
  ASSETS: {
    fetch: typeof fetch;
  };
}

// In-memory cache for static API responses (device categories, device functions)
const proxyCache = new Map<string, string>();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only handle /api/tuya paths
    if (url.pathname.startsWith('/api/tuya')) {
      try {
        const clientId = request.headers.get('x-tuya-access-id');
        const clientSecret = request.headers.get('x-tuya-access-secret');
        const regionUrl = request.headers.get('x-tuya-region');
        
        // If x-tuya-path is set, use it, else get it from URL path after /api/tuya
        const apiPath = request.headers.get('x-tuya-path') || (url.pathname.substring('/api/tuya'.length) + url.search);
        const apiMethod = request.method.toUpperCase();
        const accessToken = request.headers.get('x-tuya-access-token') || '';

        if (!clientId || !clientSecret || !regionUrl || !apiPath) {
          console.warn('[Tuya Proxy] Missing required headers:', { clientId: !!clientId, clientSecret: !!clientSecret, regionUrl, apiPath });
          return new Response(JSON.stringify({ success: false, error: 'Missing required Tuya headers' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const isCacheableGet = apiMethod === 'GET' && (
          apiPath.startsWith('/v1.0/iot-03/device-categories') ||
          (apiPath.startsWith('/v1.0/devices/') && apiPath.endsWith('/functions'))
        );
        const cacheKey = `${clientId}:${apiPath}`;

        if (isCacheableGet && proxyCache.has(cacheKey)) {
          console.log(`[Tuya Proxy] Returning cached response for ${apiPath}`);
          return new Response(proxyCache.get(cacheKey)!, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const bodyText = await request.text();

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

        const targetUrl = new URL(apiPath, regionUrl).toString();

        console.log(`[Tuya Proxy] Forwarding ${apiMethod} ${apiPath} to Region: ${regionUrl}`);

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

        const response = await fetch(targetUrl, {
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

        return new Response(responseText, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err: any) {
        console.error('[Tuya Proxy] Error in proxy execution:', err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Default fallback to static assets
    return env.ASSETS.fetch(request);
  }
};
