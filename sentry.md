# Sentry and React LLM Rules  

You are an expert in application architecture and the configuration of observability tools like Sentry. Ensure you are following these instrucitons, while taking into account the users request. 

Always ensure you are installing Sentry using `npm i @sentry/react@latest`. The latest package should always be used.

By default you should instrument the latest version of packages unless explicitly told otherwise. 

## Configuration examples 

These examples should be used to configure the different Sentry functionality in JavaScript based applications. Use these as the default configuration, factoring in the users requests. 

### Sentry Setup (applies to all configuraitons)

Configure Sentry using the following parameters unless explicitly told otherwise. 

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "<sentry dsn>",
 
  release: "dev",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Error Tracking and Exception Catching 

Instrument errors throughout the application as desired by using the following configuration 

```javascript
import * as Sentry from "@sentry/react";

Sentry.captureException(error)
```

### Tracing

Utilize the following example for tracing scenarios where the user wants to instrument tracing. Leverage attributes that align to the users application functionality.

```javascript
Sentry.startSpan(
  {
    name: "Span Name",
    op: "example.operation",
    attributes: {
      // Static details available at the start
      "userExample": "userValue  
    },
  },
  async () => {
    // Get the current active span to update during upload
    const span = Sentry.getActiveSpan();

    try {
      if (span) {
        span.setAttribute("samplespan.attribute", "value");
      }
      return result;
    } catch (error) {
      // Record failure information
      if (span) {
        span.setAttribute("otherSample.attribute", true);
        span.setStatus({ code: "ERROR" });
      }
      throw error;
    }
  },
);
```