import { useState, useEffect, useCallback } from "react";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is currently running in standalone mode (already installed/added to home screen)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser's default mini-infobar prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update state to show our custom install button
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Clear the prompt since installation succeeded
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      console.log("PWA was installed successfully");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Monitor display-mode changes to update the installed state in real-time
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    try {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    } catch {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      try {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      } catch {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    // Show the browser's install dialog
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    // Clear the deferred prompt, it can only be used once
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === "accepted";
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
}
