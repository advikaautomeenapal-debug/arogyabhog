import { useState, useEffect, useCallback } from 'react';
import { registerServiceWorker } from './pwaRegister';

/**
 * Custom React Hook for PWA installation, standalone detection, iOS guide, and network state.
 */
export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [skipWaitingFn, setSkipWaitingFn] = useState(null);
  
  // Track if user dismissed the prompt in this session
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('arogyabhog_pwa_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Check standalone display mode and device type
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone window mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    checkStandalone();

    // Check if running on iOS (iPhone, iPad, iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen to display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Listen to online / offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker
    registerServiceWorker({
      onUpdateAvailable: (applyFn) => {
        setUpdateAvailable(true);
        setSkipWaitingFn(() => applyFn);
      }
    });

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to beforeinstallprompt on supported Chromium / Android browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured and ready.');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] Arogya Bhog was successfully installed.');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger standard browser install prompt or installation guide modal
  const promptInstall = useCallback(async () => {
    if (isStandalone || isInstalled) {
      return { outcome: 'already-installed' };
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        console.log('[PWA] User choice outcome:', choiceResult.outcome);

        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
        return choiceResult;
      } catch (err) {
        console.error('[PWA] Error invoking installation prompt:', err);
      }
    }

    // Always provide immediate step-by-step installation guide if native browser prompt has not fired
    setShowIOSGuide(true);
    return { outcome: 'guide-opened' };
  }, [deferredPrompt, isStandalone, isInstalled]);

  // Dismiss banner for current session
  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('arogyabhog_pwa_dismissed', 'true');
    } catch (e) {}
  }, []);

  // Apply service worker update
  const applyUpdate = useCallback(() => {
    if (typeof skipWaitingFn === 'function') {
      skipWaitingFn();
    } else {
      window.location.reload();
    }
  }, [skipWaitingFn]);

  return {
    isInstallable: isInstallable || (isIOS && !isStandalone),
    isInstalled,
    isStandalone,
    isIOS,
    showIOSGuide,
    setShowIOSGuide,
    isOffline,
    updateAvailable,
    isDismissed,
    promptInstall,
    dismissBanner,
    applyUpdate
  };
}
