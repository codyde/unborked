import './instrument';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { migrateDatabase } from './db/migrate';
import flagsRouter from './routes/flags';

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

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', routes);
app.use('/api/flags', flagsRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  // Capture error in Sentry
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
    // Run migrations
    console.log('Running database migrations...');
    try {
      await migrateDatabase();
    } catch (error: any) {
      // If error is because tables already exist, continue
      if (error?.code === '42P07') {
        console.log('Tables already exist, skipping migrations');
      } else {
        console.error('Migration error:', error);
        throw error;
      }
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();