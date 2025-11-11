import axios from "axios";

// ============================================
// Axios Instance Configuration
// ============================================
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api',
    withCredentials: true,  // Send cookies with requests
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// Token Refresh State Management
// ============================================
let isRefreshing = false;
let failedRequestsQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

// Process queued requests after refresh completes
const processQueue = (error: any = null) => {
    failedRequestsQueue.forEach(promise => {
        error ? promise.reject(error) : promise.resolve();
    });
    failedRequestsQueue = [];
};

// ============================================
// Response Interceptor - Handle Auth & Refresh
// ============================================
api.interceptors.response.use(
    // Success handler
    (response) => {
        return response;
    },
    
    // Error handler with automatic token refresh
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const url = originalRequest?.url;
        
        // Don't refresh for auth endpoints (prevents infinite loops)
        const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
        const isAuthEndpoint = authEndpoints.some(endpoint => url?.includes(endpoint));
        
        // Check if we should attempt token refresh
        const shouldRefresh = (
            status === 401 &&                  // Unauthorized
            !originalRequest._retry &&          // Not already retried
            !isAuthEndpoint                     // Not an auth endpoint
        );
        
        if (!shouldRefresh) {
            return Promise.reject(error);
        }
        
        // Handle token refresh
        if (isRefreshing) {
            // Already refreshing - queue this request
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({ resolve, reject });
            })
            .then(() => api(originalRequest))
            .catch(err => Promise.reject(err));
        }
        
        // Start refresh process
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
            await api.post('/auth/refresh');
            processQueue();  // Retry queued requests
            return api(originalRequest);  // Retry original request
        } catch (refreshError) {
            processQueue(refreshError);  // Reject queued requests
            
            // Redirect to login (except on public pages)
            const publicPages = ['/login', '/register', '/', '/forgot-password'];
            if (!publicPages.includes(window.location.pathname)) {
                window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
