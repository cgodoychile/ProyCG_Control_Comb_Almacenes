export const API_CONFIG = {
  // Use environment variable or fallback to production URL
  BASE_URL: import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbxmZOYOHVY8v1-ohm4tU_oVQnQ8UZJ6Mo3F2aZt20dJ13O7g_CJY9eWVfsxS7dYlyKH/exec',
  TIMEOUT: 30000, // 30 seconds
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  statusCode: number;
  timestamp?: string;
}

// Helper function to build API URL
export const buildApiUrl = (entity: string, action: string, id?: string, extraParams?: Record<string, string>): string => {
  const url = new URL(API_CONFIG.BASE_URL);
  url.searchParams.append('entity', entity);
  url.searchParams.append('action', action);
  if (id) {
    url.searchParams.append('id', id);
  }
  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};

import { generateUUID } from './uuidPool';
import { offlineStorage } from './offlineStorage';

export const apiFetch = async <T>(
  entity: string,
  action: string,
  options?: {
    id?: string;
    method?: 'GET' | 'POST';
    body?: any;
    params?: Record<string, string>;
    isSync?: boolean;
  }
): Promise<ApiResponse<T>> => {
  const { id, method = 'GET', body, params, isSync = false } = options || {};

  // Check connectivity
  if (!navigator.onLine && method === 'POST') {
    if (isSync) {
      // If we are already in a sync process and somehow triggered this without connection,
      // don't re-queue it again to avoid duplication/loops.
      throw new Error('Sin conexión durante la sincronización');
    }
    console.warn(`📴 [API] Offline detected. Queuing ${entity}/${action}`);
    offlineStorage.enqueue({ entity, action, method, body, params });

    // Return a synthetic successful response to keep UI responsive
    return {
      success: true,
      data: null as any,
      message: 'Registrado localmente (pendiente de sincronización)',
      statusCode: 202, // Accepted
    };
  }

  try {
    const url = buildApiUrl(entity, action, id, params);
    console.log(`🌐 [API] ${method} ${entity}/${action}`, { url, body });

    const fetchOptions: RequestInit = {
      method,
    };

    // Only add headers for POST requests to avoid CORS preflight
    if (method === 'POST' && body) {
      // Create a stable request ID for idempotency
      const requestId = body.clientRequestId || generateUUID();
      const bodyWithId = { ...body, clientRequestId: requestId };

      // Use text/plain to avoid CORS preflight
      fetchOptions.headers = {
        'Content-Type': 'text/plain',
      };
      fetchOptions.body = JSON.stringify(bodyWithId);
      console.log(`📤 [API] Request body (ID: ${requestId}):`, bodyWithId);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      console.error('❌ [API] HTTP Error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    console.log('📥 [API] Response:', data);

    if (!data.success) {
      console.error('❌ [API] Backend Error:', data.message);
      // Return the full data object so the caller can see the statusCode from the backend
      return {
        ...data,
        statusCode: data.statusCode || 400
      };
    }

    return {
      ...data,
      statusCode: 200
    };
  } catch (error) {
    console.error('API Error:', error);

    // If fetch failed due to network, queue it
    if (method === 'POST') {
      if (isSync) {
        throw error; // Re-throw to be handled by SyncManager loop
      }
      console.warn('🔄 [API] Fetch failed, queuing request...');

      // Extract or generate ID for the queue
      const queuedBody = body || {};
      const requestId = queuedBody.clientRequestId || generateUUID();

      offlineStorage.enqueue({
        entity,
        action,
        method,
        body: { ...queuedBody, clientRequestId: requestId },
        params
      });

      return {
        success: true,
        data: null as any,
        message: 'Error de red. Guardado localmente para sincronizar luego.',
        statusCode: 202,
      };
    }

    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
    };
  }
};
