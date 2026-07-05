export interface TuyaConfig {
  accessId: string;
  accessSecret: string;
  region: string;
}

export interface FunctionItem {
  code: string;
  desc?: string;
  name: string;
  type?: string;
  value?: any;
  values?: string;
}

export interface Device {
  id: string;
  name: string;
  category: string;
  online: boolean;
  status: FunctionItem[];
  product_name: string;
  local_key: string;
}

interface TokenCache {
  accessToken: string;
  expireTime: number; // timestamp in ms
  fetchedAt: number;
}

// Global cached token in-memory to prevent multiple page reloads from hammering token endpoint
let tokenCache: TokenCache | null = null;

// Helpers to get and set config
export function getSavedConfig(): TuyaConfig | null {
  try {
    const raw = localStorage.getItem('tuya_dashboard_config');
    if (!raw) return null;
    return JSON.parse(atob(raw));
  } catch (e) {
    console.error('Error parsing Tuya config', e);
    return null;
  }
}

export function saveConfig(config: TuyaConfig) {
  localStorage.setItem('tuya_dashboard_config', btoa(JSON.stringify(config)));
  // Clear token and categories cache on new config
  tokenCache = null;
  localStorage.removeItem('tuya_cached_categories');
  localStorage.removeItem('tuya_renamed_switches');
  clearDeviceFunctionsCache();
}

export function clearConfig() {
  localStorage.removeItem('tuya_dashboard_config');
  localStorage.removeItem('tuya_cached_devices');
  localStorage.removeItem('tuya_active_switches');
  localStorage.removeItem('tuya_cached_categories');
  localStorage.removeItem('tuya_renamed_switches');
  clearDeviceFunctionsCache();
  tokenCache = null;
}

export function getCachedCategories(): Record<string, string> {
  try {
    const raw = localStorage.getItem('tuya_cached_categories');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveCachedCategories(categories: Record<string, string>) {
  localStorage.setItem('tuya_cached_categories', JSON.stringify(categories));
}

export function getRenamedSwitches(): Record<string, string> {
  try {
    const raw = localStorage.getItem('tuya_renamed_switches');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveRenamedSwitches(names: Record<string, string>) {
  localStorage.setItem('tuya_renamed_switches', JSON.stringify(names));
}

export function getCachedDeviceFunctions(deviceId: string): any[] | null {
  try {
    const raw = localStorage.getItem(`tuya_device_functions_${deviceId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveCachedDeviceFunctions(deviceId: string, functions: any[]) {
  localStorage.setItem(`tuya_device_functions_${deviceId}`, JSON.stringify(functions));
}

function clearDeviceFunctionsCache() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('tuya_device_functions_')) {
      localStorage.removeItem(key);
    }
  }
}

// Local storage device cache helpers
export function getCachedDevices(): Device[] {
  try {
    const raw = localStorage.getItem('tuya_cached_devices');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCachedDevices(devices: Device[]) {
  localStorage.setItem('tuya_cached_devices', JSON.stringify(devices));
}

export function getActiveSwitches(): { deviceId: string; code: string }[] {
  try {
    const raw = localStorage.getItem('tuya_active_switches');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveActiveSwitches(active: { deviceId: string; code: string }[]) {
  localStorage.setItem('tuya_active_switches', JSON.stringify(active));
}

// Local API proxy request dispatch helper
async function requestTuya<T>(
  config: TuyaConfig,
  path: string,
  method: string = 'GET',
  body: any = null,
  accessToken: string = ''
): Promise<T> {
  const headers: Record<string, string> = {
    'x-tuya-access-id': config.accessId,
    'x-tuya-access-secret': config.accessSecret,
    'x-tuya-region': config.region,
  };

  if (accessToken) {
    headers['x-tuya-access-token'] = accessToken;
  }

  const response = await fetch(`/api/tuya${path}`, {
    method: method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : (body ? JSON.stringify(body) : undefined),
  });

  const resJson = await response.json();
  
  if (!response.ok || resJson.success === false) {
    throw new Error(resJson.error || resJson.msg || `Tuya API Error (Status ${response.status})`);
  }

  return resJson;
}

// Fetch a new access token
async function fetchAccessToken(config: TuyaConfig): Promise<string> {
  // Check memory cache first
  if (tokenCache && tokenCache.expireTime > Date.now()) {
    return tokenCache.accessToken;
  }

  const result = await requestTuya<any>(config, '/v1.0/token?grant_type=1', 'GET');
  
  if (result.success && result.result && result.result.access_token) {
    const { access_token, expire_time } = result.result;
    tokenCache = {
      accessToken: access_token,
      // expire_time is in seconds. Buffer it by 5 minutes to prevent boundary errors
      expireTime: Date.now() + (expire_time * 1000) - (5 * 60 * 1000),
      fetchedAt: Date.now(),
    };
    return access_token;
  } else {
    throw new Error(result.msg || 'Token response did not include a valid access_token');
  }
}

// Public API methods
export async function testConnection(config: TuyaConfig): Promise<boolean> {
  try {
    const token = await fetchAccessToken(config);
    return !!token;
  } catch (e) {
    console.error('Connection test failed:', e);
    throw e;
  }
}

export async function fetchDevices(config: TuyaConfig): Promise<Device[]> {
  const token = await fetchAccessToken(config);
  
  // Recursively fetch devices
  const allDevices: any[] = [];
  let lastRowKey = '';
  let hasMore = true;

  while (hasMore) {
    const path = lastRowKey 
      ? `/v1.0/iot-01/associated-users/devices?last_row_key=${encodeURIComponent(lastRowKey)}`
      : '/v1.0/iot-01/associated-users/devices';
      
    const res = await requestTuya<any>(config, path, 'GET', null, token);
    
    if (res.success && res.result && res.result.devices) {
      allDevices.push(...res.result.devices);
      hasMore = res.result.has_more;
      lastRowKey = res.result.last_row_key;
    } else {
      break;
    }
  }

  // Get device categories
  let categoryMap: Record<string, string> = getCachedCategories();
  if (Object.keys(categoryMap).length === 0) {
    try {
      const categoriesRes = await requestTuya<any>(config, '/v1.0/iot-03/device-categories', 'GET', null, token);
      if (categoriesRes.success && Array.isArray(categoriesRes.result)) {
        categoriesRes.result.forEach((cat: any) => {
          categoryMap[cat.code] = cat.name;
        });
        saveCachedCategories(categoryMap);
      }
    } catch (e) {
      console.warn('Failed to fetch categories list, using raw codes', e);
    }
  }

  // For each device, fetch functions in parallel to get switch names and types
  const activeSwitches = getActiveSwitches();
  const activeDeviceIds = new Set(activeSwitches.map((s) => s.deviceId));

  const populatePromises = allDevices.map(async (dev) => {
    try {
      const rawStatus = dev.status || [];
      const isDashboardDevice = activeDeviceIds.has(dev.id);

      console.log('[Tuya API] Processing device:', { 
        id: dev.id, 
        name: dev.name, 
        category: dev.category, 
        statusCount: rawStatus.length,
        isDashboardDevice
      });
      
      if (!dev.status) {
        console.warn('[Tuya API] Device has no status array (possibly a gateway or offline sensor):', dev);
      }
      
      let functions = [];
      if (isDashboardDevice) {
        const cached = getCachedDeviceFunctions(dev.id);
        if (cached) {
          functions = cached;
        } else {
          const funcRes = await requestTuya<any>(config, `/v1.0/devices/${dev.id}/functions`, 'GET', null, token);
          functions = (funcRes.success && funcRes.result?.functions) || [];
          if (funcRes.success && funcRes.result?.functions) {
            saveCachedDeviceFunctions(dev.id, functions);
          }
        }
      }
      
      // Merge function metadata with the current status values
      const mergedStatus = rawStatus.map((stat: any) => {
        const funcItem = functions.find((f: any) => f.code === stat.code);
        return {
          code: stat.code,
          value: stat.value,
          name: funcItem?.name || stat.code,
          type: funcItem?.type || 'Boolean', // Default to boolean if unknown
          values: funcItem?.values || '',
        };
      });

      return {
        id: dev.id,
        name: dev.name,
        category: categoryMap[dev.category] || dev.category,
        online: dev.online,
        status: mergedStatus,
        product_name: dev.product_name || '',
        local_key: dev.local_key || '',
      };
    } catch (e) {
      console.error(`Failed to fetch functions for device ${dev.id}`, e);
      // Fallback: use raw status safely
      const rawStatus = dev.status || [];
      return {
        id: dev.id,
        name: dev.name,
        category: categoryMap[dev.category] || dev.category,
        online: dev.online,
        status: rawStatus.map((stat: any) => ({
          code: stat.code,
          value: stat.value,
          name: stat.code,
          type: 'Boolean',
          values: '',
        })),
        product_name: dev.product_name || '',
        local_key: dev.local_key || '',
      };
    }
  });

  const processedDevices = await Promise.all(populatePromises);
  return processedDevices;
}

export async function sendDeviceCommand(
  config: TuyaConfig,
  deviceId: string,
  code: string,
  value: boolean | string | number
): Promise<boolean> {
  const token = await fetchAccessToken(config);
  const path = `/v1.0/iot-03/devices/${deviceId}/commands`;
  const body = {
    commands: [
      {
        code,
        value,
      },
    ],
  };

  const res = await requestTuya<any>(config, path, 'POST', body, token);
  return !!res.success;
}

// Utility to filter switchable commands similar to Raycast implementation
export function isSwitchableCommand(category: string, code: string, type?: string): boolean {
  const catLower = category.toLowerCase();
  const codeLower = code.toLowerCase();
  
  // For switches, sockets, look for boolean types or switch commands
  if (catLower.includes('switch') || catLower === 'kg' || catLower.includes('socket')) {
    return type === 'Boolean' || codeLower.startsWith('switch');
  }

  // For lights
  if (catLower.includes('light') || catLower === 'dj' || catLower.includes('lamp') || catLower.includes('led')) {
    return codeLower === 'switch_led' || codeLower.startsWith('switch');
  }

  // For curtains
  if (catLower.includes('curtain') || catLower === 'cl') {
    return codeLower === 'control';
  }

  // General fallback: if code starts with switch or power
  return codeLower.startsWith('switch') || codeLower.startsWith('power');
}
