// Auto-reload utility for connectivity errors

let errorCount = 0;
let lastErrorTime = 0;
const MAX_ERRORS = 3;
const ERROR_WINDOW = 30000; // 30 seconds
const RELOAD_DELAY = 2000; // 2 seconds

export const handleConnectivityError = (error: any) => {
  const now = Date.now();
  
  // Reset counter if enough time has passed
  if (now - lastErrorTime > ERROR_WINDOW) {
    errorCount = 0;
  }
  
  errorCount++;
  lastErrorTime = now;
  
  console.log(`🚨 Connectivity error #${errorCount}:`, error.message);
  
  // Check if it's a connectivity error
  const isConnectivityError = 
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('fetch') ||
    error.code === 'NETWORK_ERROR';
  
  if (isConnectivityError) {
    console.log('🔄 Activating offline mode immediately...');
    
    // Notify that we're going offline
    if (window.postMessage) {
      window.postMessage({ type: 'FALLBACK_ACTIVATED' }, '*');
    }
    
    // If too many errors, suggest reload
    if (errorCount >= MAX_ERRORS) {
      console.log('⚠️ Multiple connectivity errors detected');
      console.log('💡 Consider reloading the page for fresh connection attempt');
      
      // Show a user-friendly message
      const shouldReload = confirm(
        'Se detectaron múltiples errores de conexión.\n\n' +
        '¿Deseas recargar la página para intentar reconectarte?\n\n' +
        '(Si eliges "Cancelar", continuarás en modo offline)'
      );
      
      if (shouldReload) {
        setTimeout(() => {
          window.location.reload();
        }, RELOAD_DELAY);
      }
    }
  }
};

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error && typeof error === 'object') {
    handleConnectivityError(error);
  }
});

// Global error handler for general errors
window.addEventListener('error', (event) => {
  const error = event.error;
  if (error && typeof error === 'object') {
    handleConnectivityError(error);
  }
});

console.log('🛡️ Auto-reload error handler initialized');
