import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { FeatureFlags, getCurrentFlagMap, fetchServerDefaults, getLocalStorage } from '../utils/featureFlags';
import * as Sentry from '@sentry/react';

const { error: logError, debug, fmt } = Sentry.logger;

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  refreshFlagsFromSource: () => void;
  updateLocalFlag: (flagName: string, value: boolean) => void;
  error: Error | null;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>({} as FeatureFlags);
  const [serverDefaults, setServerDefaults] = useState<FeatureFlags>({} as FeatureFlags);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [flagsToEdit, setFlagsToEdit] = useState<FeatureFlags>({} as FeatureFlags);
  const [isInitialized, setIsInitialized] = useState(false);
  const isMounted = useRef(true);

  // Load flags once on initialization
  const refreshFlagsFromSource = useCallback(async () => {
    // Skip if already initialized to prevent multiple calls
    if (isInitialized && Object.keys(flags).length > 0) {
      debug("🚫 Flags already loaded, skipping initialization");
      return;
    }

    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) debug("🔄 Loading flags from source...");

    try {
      // This will only fetch from server if needed
      const currentFlags = await getCurrentFlagMap();
      if (isLocalhost) debug("📊 Got flags:", currentFlags);

      if (isMounted.current) {
        setFlags({ ...currentFlags } as FeatureFlags);
      }

      // Store server defaults if not already loaded
      if (Object.keys(serverDefaults).length === 0) {
        const defaults = await fetchServerDefaults();
        if (isMounted.current) setServerDefaults({ ...defaults });
      }

      // Mark as initialized so we don't fetch again
      setIsInitialized(true);

      if (isLocalhost) debug("✅ Flags loaded successfully");
    } catch (err: any) {
      if (isMounted.current) {
        setLoadError(err instanceof Error ? err : new Error(String(err)));
      }
      logError(fmt`❌ Failed to load flags: ${err?.message}`, { stack: err?.stack, errorObject: err });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [flags, isInitialized, serverDefaults]);

  // Only handle local storage changes for toolbar overrides
  const refreshFromLocalStorage = useCallback(async () => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) debug("📱 Updating flags from localStorage overrides");

    try {
      const overrides = getLocalStorage();
      // Store server defaults if not already loaded
      if (Object.keys(serverDefaults).length === 0) {
        const defaults = await fetchServerDefaults();
        if (isMounted.current) setServerDefaults({ ...defaults });
      }
      const currentFlags = { ...serverDefaults, ...flags }; // Merge server defaults with current flags before overrides
      const mergedFlags = {
        ...currentFlags,
        ...overrides
      } as FeatureFlags;

      if (isLocalhost) debug("✅ Flags updated with localStorage overrides:", mergedFlags);
      if (isMounted.current) setFlags(mergedFlags);
    } catch (err: any) {
      logError(fmt`❌ Failed to refresh from localStorage: ${err?.message}`, { stack: err?.stack, errorObject: err });
    }
  }, [flags, serverDefaults]);

  // Direct update of a specific flag
  const updateLocalFlag = useCallback((flagName: string, value: boolean) => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) debug(`🔄 Updating flag: ${flagName} = ${value}`);

    setFlags(current => ({
      ...current,
      [flagName]: value
    }));
  }, []);

  // Load flags once on mount
  useEffect(() => {
    refreshFlagsFromSource();
  }, []); // Empty dependency array ensures this runs only once

  // Listen for localStorage changes from the toolbar
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'unborked-flag-overrides') {
        const isLocalhost = window.location.hostname === 'localhost';
        if (isLocalhost) debug("📢 Storage change detected, updating flags...");

        if (e.newValue !== e.oldValue) {
          refreshFromLocalStorage();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshFromLocalStorage]);

  // Listen for custom flag-value-changed events
  useEffect(() => {
    const handleFlagChange = (e: CustomEvent) => {
      const { flagName, value } = e.detail;
      updateLocalFlag(flagName, value);
    };

    window.addEventListener('flag-value-changed', handleFlagChange as EventListener);
    return () => window.removeEventListener('flag-value-changed', handleFlagChange as EventListener);
  }, [updateLocalFlag]);

  // Handle admin panel flag editor
  useEffect(() => {
    if (isOpen) {
      const fetchCurrentDefaults = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
          const response = await fetch('http://localhost:3000/api/flags');
          if (!response.ok) {
            throw new Error(`Failed to fetch defaults: ${response.statusText}`);
          }
          const data = await response.json();
          setFlagsToEdit(data);
        } catch (err: any) {
          logError(fmt`Error fetching flag defaults: ${err?.message}`, { stack: err?.stack, errorObject: err });
          setLoadError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsLoading(false);
        }
      };
      fetchCurrentDefaults();
    }
  }, [isOpen]);

  // Memoize the context value to prevent unnecessary renders
  const contextValue = useMemo(() => {
    return {
      flags,
      refreshFlagsFromSource,
      updateLocalFlag,
      error: loadError
    };
  }, [flags, refreshFlagsFromSource, updateLocalFlag, loadError]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}