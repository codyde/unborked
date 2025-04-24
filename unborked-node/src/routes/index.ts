import express from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import productQueryRoutes from './productQuery';
import purchaseRoutes from './purchases';
import cartV2Routes from './cart_v2';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/product-query', productQueryRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/v2/cart', cartV2Routes);

export default router;