/**
 * Performance optimization utilities
 */

/**
 * Preload a resource to improve loading times
 */
export const preloadResource = (src: string, type: 'video' | 'image' | 'script') => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = type;
  link.href = src;
  
  if (type === 'video') {
    link.type = 'video/mp4';
  }
  
  document.head.appendChild(link);
};

/**
 * Prefetch a resource for future navigation
 */
export const prefetchResource = (src: string) => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = src;
  
  document.head.appendChild(link);
};

/**
 * Report Core Web Vitals metrics
 */
export const reportWebVitals = (metric: any) => {
  if (window.location.hostname === 'localhost') {
    console.log(metric);
  }
};

/**
 * Lazy load videos on scroll visibility
 */
export const useIntersectionObserver = (callback: IntersectionObserverCallback, options = {}) => {
  return new IntersectionObserver(callback, {
    threshold: 0.1,
    ...options,
  });
};
