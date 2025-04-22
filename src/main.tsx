import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as Sentry from "@sentry/react";
import { fetchServerDefaults, setFeatureFlag, getCurrentFlagMap } from './utils/featureFlags';

Sentry.init({
  dsn: "https://4cce768b3178c61875e8f1a8e039294b@o4508130833793024.ingest.us.sentry.io/4509088007585792",

  _experiments: {
    enableLogs: true,
  },

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.featureFlagsIntegration({
      enableAutomaticPolling: false,
      pollingIntervalSeconds: 0
    }),
  ],

  tracesSampleRate: 1.0,
  tracePropagationTargets: ["http://localhost:3000"],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const { debug, info, warn, error, fmt } = Sentry.logger;


// Initialize the application with feature flags fully loaded before rendering
(async () => {
  try {
    info("🚀 Initializing application - loading feature flags...");
    
    // First, fetch server defaults and set Sentry context
    const serverDefaults = await fetchServerDefaults();
    info(fmt`Server defaults loaded: ${JSON.stringify(serverDefaults)}`);
    
    // Set each flag in Sentry
    Object.entries(serverDefaults).forEach(([flag, value]) => {
      setFeatureFlag(flag, Boolean(value)); 
    });
    
    // Ensure flags are fully initialized by calling getCurrentFlagMap
    // This will block until initialization is complete
    await getCurrentFlagMap();
    info("✅ Feature flags fully initialized, rendering application");
    
    // Now that flags are fully initialized, render the app
    createRoot(document.getElementById('root')!).render(
      <>
        <App />
      </>
    );
  } catch (err: any) {
    error(fmt`❌ Failed to initialize application: ${err.message}`, { stack: err.stack, errorObject: err });
    
    // Render the app anyway, but with a warning
    warn(fmt`Rendering application without properly initialized feature flags: ${err.message}`, { stack: err.stack, errorObject: err });
    createRoot(document.getElementById('root')!).render(
      <>
        <App />
      </>
    );
  }
})();
