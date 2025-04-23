import express from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import productQueryRoutes from './productQuery';
import purchaseRoutes from './purchases';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/product-query', productQueryRoutes);
router.use('/purchases', purchaseRoutes);

export default router;