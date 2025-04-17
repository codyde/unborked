import express, { Request, Response } from 'express';
import { db } from '../db';
import { products } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  return await Sentry.startSpan(
    {
      op: 'products.list',
      name: 'List Products',
      attributes: {
        'endpoint': '/products',
        'method': 'GET'
      }
    },
    async (span) => {
      try {
        const result = await db.execute(sql`SELECT * FROM goods`);
        const allProducts = result.rows;
        span.setAttribute('products.count', allProducts.length);
        res.json(allProducts);
        return allProducts;
      } catch (error) {
        console.error('Error fetching products:', error);
        span.setAttributes({
          'error': true,
          'error.message': error instanceof Error ? error.message : 'Unknown error'
        });
        Sentry.captureException(error);
        res.status(500).json({ error: 'Failed to fetch products' });
        throw error;
      }
    }
  );
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  return await Sentry.startSpan(
    {
      op: 'products.get',
      name: 'Get Product',
      attributes: {
        'endpoint': '/products/:id',
        'method': 'GET',
        'product.id': req.params.id
      }
    },
    async (span) => {
      try {
        const { id } = req.params;
        const result = await db.execute(sql`SELECT * FROM products WHERE id = ${parseInt(id)}`);
        const product = result.rows;

        if (product.length === 0) {
          span.setAttributes({
            'error': true,
            'error.type': 'not_found'
          });
          return res.status(404).json({ error: 'Product not found' });
        }

        span.setAttribute('product.found', true);
        res.json(product[0]);
        return product[0];
      } catch (error) {
        console.error('Error fetching product:', error);
        span.setAttributes({
          'error': true,
          'error.message': error instanceof Error ? error.message : 'Unknown error'
        });
        Sentry.captureException(error);
        res.status(500).json({ error: 'Failed to fetch product' });
        throw error;
      }
    }
  );
});

// Create a new product
router.post('/', async (req: Request, res: Response) => {
  return await Sentry.startSpan(
    {
      op: 'products.create',
      name: 'Create Product',
      attributes: {
        'endpoint': '/products',
        'method': 'POST',
        'product.name': req.body.name,
        'product.category': req.body.category || 'uncategorized'
      }
    },
    async (span) => {
      try {
        const { name, description, price, image, category } = req.body;

        if (!name || !description || !price) {
          span.setAttributes({
            'error': true,
            'error.type': 'validation_failed'
          });
          return res.status(400).json({ error: 'Name, description, and price are required' });
        }

        const result = await db.execute(sql`INSERT INTO products (name, description, price, image, category) VALUES (${name}, ${description}, ${price}, ${image}, ${category}) RETURNING *`);
        const newProduct = result.rows[0];

        span.setAttribute('product.id', String(newProduct.id));
        res.status(201).json(newProduct);
        return newProduct;
      } catch (error) {
        console.error('Error creating product:', error);
        span.setAttributes({
          'error': true,
          'error.message': error instanceof Error ? error.message : 'Unknown error'
        });
        Sentry.captureException(error);
        res.status(500).json({ error: 'Failed to create product' });
        throw error;
      }
    }
  );
});

export default router;