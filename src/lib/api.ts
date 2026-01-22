export const API_CONFIG = {
  // Use environment variable or fallback to production URL
  BASE_URL: import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbwS-FXUFEmVD7VxYcSbacsfbHgZr1uTbUzNvqK9J4SlldB4vHAr-bex9MKRNp34qB8aPg/exec',
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

export const apiFetch = async <T>(
  entity: string,
  action: string,
  options?: {
    id?: string;
    method?: 'GET' | 'POST';
    body?: any;
    params?: Record<string, string>;
  }
): Promise<ApiResponse<T>> => {
  const { id, method = 'GET', body, params } = options || {};

  try {
    const url = buildApiUrl(entity, action, id, params);
    console.log(`🌐 [API] ${method} ${entity}/${action}`, { url, body });

    const fetchOptions: RequestInit = {
      method,
    };

    // Only add headers for POST requests to avoid CORS preflight
    if (method === 'POST' && body) {
      // Use text/plain to avoid CORS preflight
      fetchOptions.headers = {
        'Content-Type': 'text/plain',
      };
      fetchOptions.body = JSON.stringify(body);
      console.log('📤 [API] Request body:', body);
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
      throw new Error(data.message || 'Error en la operación del servidor');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error desconocido',
      statusCode: 500,
    };
  }
};

