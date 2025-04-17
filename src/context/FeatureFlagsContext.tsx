import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { FeatureFlags, getCurrentFlagMap, fetchServerDefaults, getLocalStorage } from '../utils/featureFlags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  refreshFlagsFromSource: () => Promise<void>;
  updateLocalFlag: (flagName: string, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>({} as FeatureFlags);
  const [serverDefaults, setServerDefaults] = useState<FeatureFlags>({} as FeatureFlags);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagsToEdit, setFlagsToEdit] = useState<FeatureFlags>({} as FeatureFlags);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load flags once on initialization
  const refreshFlagsFromSource = useCallback(async () => {
    // Skip if already initialized to prevent multiple calls
    if (isInitialized && Object.keys(flags).length > 0) {
      console.log("🚫 Flags already loaded, skipping initialization");
      return;
    }
    
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) console.log("🔄 Loading flags from source...");
    
    try {
      // This will only fetch from server if needed
      const currentFlags = await getCurrentFlagMap();
      if (isLocalhost) console.log("📊 Got flags:", currentFlags);
      
      // Set flags in state
      setFlags({...currentFlags} as FeatureFlags);
      
      // Store server defaults if not already loaded
      if (Object.keys(serverDefaults).length === 0) {
        const defaults = await fetchServerDefaults();
        setServerDefaults({...defaults});
      }
      
      // Mark as initialized so we don't fetch again
      setIsInitialized(true);
      
      if (isLocalhost) console.log("✅ Flags loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load flags:", error);
      setFlags({} as FeatureFlags);
    }
  }, [flags, isInitialized, serverDefaults]);

  // Only handle local storage changes for toolbar overrides
  const refreshFromLocalStorage = useCallback(() => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) console.log("📱 Updating flags from localStorage overrides");
    
    try {
      const overrides = getLocalStorage();
      
      setFlags(current => {
        const mergedFlags = {
          ...current,
          ...overrides
        } as FeatureFlags;
        
        if (isLocalhost) console.log("✅ Flags updated with localStorage overrides:", mergedFlags);
        return mergedFlags;
      });
    } catch (error) {
      console.error("❌ Failed to refresh from localStorage:", error);
    }
  }, []);

  // Direct update of a specific flag
  const updateLocalFlag = useCallback((flagName: string, value: boolean) => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) console.log(`🔄 Updating flag: ${flagName} = ${value}`);
    
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
        if (isLocalhost) console.log("📢 Storage change detected, updating flags...");
        
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
        setError(null);
        try {
          const response = await fetch('http://localhost:3000/api/flags');
          if (!response.ok) {
            throw new Error(`Failed to fetch defaults: ${response.statusText}`);
          }
          const data = await response.json();
          setFlagsToEdit(data);
        } catch (err) {
          console.error("Error fetching flag defaults:", err);
          setError(err instanceof Error ? err.message : "Unknown error fetching defaults");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCurrentDefaults();
    }
  }, [isOpen]);

  // Memoize the context value to prevent unnecessary renders
  const contextValue = useMemo(() => {
    return { flags, refreshFlagsFromSource, updateLocalFlag };
  }, [flags, refreshFlagsFromSource, updateLocalFlag]);

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
} 