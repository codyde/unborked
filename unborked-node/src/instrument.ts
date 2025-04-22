import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
    dsn: "https://8af3b5d3bd35eb9fc7a9161293df146c@o4508130833793024.ingest.us.sentry.io/4509118548606976",
    integrations: [
      nodeProfilingIntegration(),
    ],
    _experiments: {
      enableLogs: true,
    },
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    debug: true
  });

