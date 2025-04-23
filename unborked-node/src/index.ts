import './instrument';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { migrateDatabase } from './db/migrate';
import flagsRouter from './routes/flags';

// Import Sentry logger functions
const { debug, info, warn, error, fmt } = Sentry.logger;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS Configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_URL) {
      callback(null, true);
    } else {
      // Log CORS denial for debugging
      debug(fmt`CORS denied for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'sentry-trace',
    'baggage'
  ],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware - Using info level
app.use((req: Request, res: Response, next: NextFunction) => {
  info(fmt`${req.method} ${req.url} - Request received`);
  // Optional: Add more details like headers or body for debug level if needed
  // debug(fmt`Request headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Routes
app.use('/', routes);
app.use('/api/flags', flagsRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error details using Sentry logger
  error(fmt`Unhandled error occurred: ${err.message}`, { stack: err.stack });

  // Capture error in Sentry (already present, which is good)
  Sentry.captureException(err);
  
  res.status(500).json({ 
    error: 'Something broke!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Handle preflight requests
app.options('*', cors(corsOptions));

// Start server
const startServer = async () => {
  try {
    info('🚀 Starting server...');
    // Run migrations
    // info('Running database migrations...');
    // try {
    //   await migrateDatabase();
    //   info('✅ Database migrations completed successfully.');
    // } catch (migrationError: any) {
    //   // If error is because tables already exist, log as warning and continue
    //   if (migrationError?.code === '42P07') {
    //     warn('⚠️ Tables already exist, skipping migrations.');
    //   } else {
    //     error(fmt`❌ Migration error: ${migrationError.message}`, { stack: migrationError.stack });
    //     // Re-throw the error to be caught by the outer catch block
    //     throw migrationError;
    //   }
    // }

    // Start server
    app.listen(PORT, () => {
      info(fmt`✅ Server is running on port ${PORT}`);
      info(fmt`🔗 Allowed frontend origin: ${FRONTEND_URL}`);
    });

  } catch (startupError: any) {
    error(fmt`❌ Failed to start server: ${startupError.message}`, { stack: startupError.stack });
    Sentry.captureException(startupError); // Capture startup errors too
    process.exit(1);
  }
};

startServer();