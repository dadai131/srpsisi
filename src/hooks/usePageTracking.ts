import { useEffect } from 'react';

// Hook para rastrear visualizações de página via edge function segura
export function usePageTracking() {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Call the secure edge function
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-pageview`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
      } catch (error) {
        // Silently fail - tracking shouldn't break the app
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, []);
}
