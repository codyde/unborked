import express, { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';

const router = express.Router();

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  // Start span for user registration
  return await Sentry.startSpan(
    {
      op: 'auth.register',
      name: 'User Registration',
      attributes: {
        'endpoint': '/auth/register',
        'method': 'POST',
        'username': req.body.username
      }
    },
    async (span) => {

      try {
        const { username, password } = req.body;

        if (!username || !password) {
          span?.setAttributes({
            'error': true,
            'error.type': 'validation_failed'
          });
          
          return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);

        if (existingUser.length > 0) {
          span?.setAttributes({
            'error': true,
            'error.type': 'user_exists'
          });
          
          return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const [newUser] = await db.insert(users).values({
          username,
          password, // In a real app, this would be hashed
        }).returning();

        span?.setAttribute('user.id', newUser.id);
        

        res.status(201).json({
          message: 'User registered successfully',
          userId: newUser.id
        });
      } catch (error) {
        console.error('Registration error:', error);
        span?.setAttributes({
          'error': true,
          'error.message': error instanceof Error ? error.message : 'Unknown error'
        });
        
        Sentry.captureException(error);
        res.status(500).json({ error: 'Failed to register user' });
      }
    }
  );
});

  // Login
  router.post('/login', async (req: Request, res: Response) => {
    // Start span for user login
    return await Sentry.startSpan(
      {
        op: 'auth.login',
        name: 'User Login',
        attributes: {
          'endpoint': '/auth/login',
          'method': 'POST',
          'username': req.body.username
        }
      },
      async (span) => {

        try {
          const { username, password } = req.body;

          if (!username || !password) {
            span?.setAttributes({
              'error': true,
              'error.type': 'validation_failed'
            });
            
            return res.status(400).json({ error: 'Username and password are required' });
          }

          // Find user
          const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

          if (user.length === 0 || user[0].password !== password) {
            span?.setAttributes({
              'error': true,
              'error.type': 'invalid_credentials'
            });
            
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Generate JWT token
          const token = jwt.sign(
            {
              userId: user[0].id,
              username: user[0].username,
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
          );

          span?.setAttribute('user.id', user[0].id);

          res.json({
            token,
            user: {
              id: user[0].id,
              username: user[0].username,
            },
          });
        } catch (error) {
          console.error('Login error:', error);
          span?.setAttributes({
            'error': true,
            'error.message': error instanceof Error ? error.message : 'Unknown error'
          });
          Sentry.captureException(error);
          res.status(500).json({ error: 'Failed to login' });
        }
      }
    );
  });

  export default router;  