import express from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import purchaseRoutes from './purchases';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/purchases', purchaseRoutes);

export default router;