import express, { Request, Response } from 'express';
import { db } from '../db';
import { purchases } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';
import * as Sentry from '@sentry/node';

// Define interface for authorized request with user
interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    [key: string]: any;
  };
}

const router = express.Router();

// Create a new purchase
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  // Start span for creating a purchase
  return await Sentry.startSpan(
    {
      op: 'purchase.create',
      name: 'Create Purchase',
      attributes: {
      'endpoint': '/purchases',
      'method': 'POST',
      'purchase.total': req.body.total,
      'purchase.items_count': req.body.items?.length || 0
    }
  },
  async (span) => {
  
  try {
    const { items, total } = req.body;
    
    if (!req.user) {
      span?.setAttributes({
        'error': true,
        'error.type': 'unauthorized'
      });
      
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user.userId;
    span?.setAttribute('user.id', userId);

    if (!items || !total) {
      span?.setAttributes({
        'error': true,
        'error.type': 'validation_failed'
      });
      
      return res.status(400).json({ error: 'Items and total are required' });
    }

    const [purchase] = await db.insert(purchases).values({
      userId,
      items,
      total
    }).returning();

    span?.setAttribute('purchase.id', purchase.id);
    

    res.status(201).json({
      message: 'Purchase successful',
      purchase
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    span?.setAttributes({
      'error': true,
      'error.message': error instanceof Error ? error.message : 'Unknown error'
    });
    
    Sentry.captureException(error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
    }
  );
  });

// Get user purchase history
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  // Start span for listing user purchases
  return await Sentry.startSpan(
    {
      op: 'purchase.list',
      name: 'List User Purchases',
      attributes: {
      'endpoint': '/purchases',
      'method': 'GET'
    }
  },
  async (span) => {
  
  try {
    if (!req.user) {
      span?.setAttributes({
        'error': true,
        'error.type': 'unauthorized'
      });
      
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user.userId;
    span?.setAttribute('user.id', userId);
    
    const userPurchases = await db.select().from(purchases).where(eq(purchases.userId, userId));
    
    span?.setAttribute('purchases.count', userPurchases.length);
    
    
    res.json(userPurchases);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    span?.setAttributes({
      'error': true,
      'error.message': error instanceof Error ? error.message : 'Unknown error'
    });
    
    Sentry.captureException(error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
  }
  );
  });

export default router;