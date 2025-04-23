import express, { Request, Response } from 'express';
import { db } from '../db';
import { products } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/node';

const router = express.Router();

const {  debug, info, warn, error, fmt } = Sentry.logger;

router.get('/', async (_req: Request, res: Response) => {

  return await Sentry.startSpan(
    {
      op: 'products.list.new',
      name: 'List Products',
      attributes: {
        'endpoint': '/product-query', 
        'method': 'GET'
      }
    },
    async (span) => {
      info('Fetching all goods');
      try {
        const productRows = await db.execute(sql`SELECT * FROM goods`);
        const allProducts = productRows.rows;

        info(fmt`Goods: ${JSON.stringify(allProducts)}`);

        span.setAttribute('goods.count', allProducts.length);

        info(fmt`Successfully fetched ${allProducts.length} goods`);
        
        res.json(allProducts);
        return allProducts;
      } catch (err: any) {
        error(fmt`Error fetching goods: ${err.message}`, { stack: err.stack });
        span.setAttributes({
          'error': true,
          'error.message': err instanceof Error ? err.message : 'Unknown error'
        });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Failed to fetch goods' });
        throw err;
      }
    }
  );
});

router.get('/v2', async (_req: Request, res: Response) => {
  return await Sentry.startSpan(
    {
      op: 'products.list.v2',
      name: 'List Products',
      attributes: {
        'endpoint': '/product-query/v2', 
        'method': 'GET'
      }
    },
    async (span) => {
      info('Fetching all products (V2)');
      try {
        debug('Fetching all product IDs');
        const productIds = await db.select({ id: products.id }).from(products);
        const allProducts = [];

        debug(fmt`Starting query loop for ${productIds.length} products`);
        for (const item of productIds) {
          const product = await db.select().from(products).where(eq(products.id, item.id)).limit(1);
          if (product.length > 0) {
            allProducts.push(product[0]);
          }
        }

        info(fmt`Products (v2): ${JSON.stringify(allProducts)}`);

        span.setAttribute('products.count', allProducts.length);
        info(fmt`Successfully fetched ${allProducts.length} products (V2)`);
        res.json(allProducts);
        return allProducts;
      } catch (err: any) {
        error(fmt`Error fetching products (V2): ${err.message}`, { stack: err.stack });
        span.setAttributes({
          'error': true,
          'error.message': err instanceof Error ? err.message : 'Unknown error'
        });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Failed to fetch products (v2)' });
        throw err; // Re-throw error after logging
      }
    }
  );
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  // Start span for getting a single product
  return await Sentry.startSpan(
    {
      op: 'products.get',
      name: 'Get Product',
      attributes: {
        'endpoint': '/products/:id', // Will change this later
        'method': 'GET',
        'product.id': req.params.id
      }
    },
    async (span) => {
      const productId = req.params.id;
      info(fmt`Fetching product by ID: ${productId}`);
      try {
        // const { id } = req.params; // Already have productId
        debug(fmt`Querying database for product ID: ${productId}`);
        const product = await db.select().from(products).where(eq(products.id, parseInt(productId))).limit(1);

        if (product.length === 0) {
          warn(fmt`Product not found for ID: ${productId}`);
          span.setAttributes({
            'error': true,
            'error.type': 'not_found'
          });
          return res.status(404).json({ error: 'Product not found' });
        }

        span.setAttribute('product.found', true);
        info(fmt`Successfully fetched product ID: ${productId}`);
        res.json(product[0]);
        return product[0];
      } catch (err: any) {
        error(fmt`Error fetching product ID ${productId}: ${err.message}`, { stack: err.stack });
        span.setAttributes({
          'error': true,
          'error.message': err instanceof Error ? err.message : 'Unknown error'
        });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Failed to fetch product' });
        throw err; // Re-throw error after logging
      }
    }
  );
});

// Create a new product
router.post('/', async (req: Request, res: Response) => {
  // Start span for creating a product
  return await Sentry.startSpan(
    {
      op: 'products.create',
      name: 'Create Product',
      attributes: {
        'endpoint': '/products', // Will change this later
        'method': 'POST',
        'product.name': req.body.name,
        'product.category': req.body.category || 'uncategorized'
      }
    },
    async (span) => {
      info(fmt`Attempting to create product: ${req.body.name || 'N/A'}`);
      try {
        const { name, description, price, image, category } = req.body;

        if (!name || !description || !price) {
          warn('Product creation failed: Missing required fields (name, description, price).');
          span.setAttributes({
            'error': true,
            'error.type': 'validation_failed'
          });
          return res.status(400).json({ error: 'Name, description, and price are required' });
        }

        debug('Inserting new product into database');
        const [newProduct] = await db.insert(products).values({
          name,
          description,
          price,
          image,
          category
        }).returning();

        span.setAttribute('product.id', newProduct.id);
        info(fmt`Successfully created product ID: ${newProduct.id} (Name: ${name})`);
        res.status(201).json(newProduct);
        return newProduct;
      } catch (err: any) {
        error(fmt`Error creating product: ${err.message}`, { stack: err.stack });
        span.setAttributes({
          'error': true,
          'error.message': err instanceof Error ? err.message : 'Unknown error'
        });
        Sentry.captureException(err);
        res.status(500).json({ error: 'Failed to create product' });
        throw err; // Re-throw error after logging
      }
    }
  );
});

export default router;
