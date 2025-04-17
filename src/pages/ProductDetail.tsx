import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { productService } from '../services/api';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await productService.getProductById(parseInt(id));
        setProduct(data);
        setError(null);
      } catch (err) {
        setError('Failed to load product details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      dispatch({
        type: 'ADD_ITEM',
        payload: { ...product, quantity: 1 },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#39ff14]"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-red-500">{error || 'Product not found'}</p>
        <Link to="/" className="inline-block mt-4 text-[#39ff14] hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center text-[#39ff14] hover:underline mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Products
      </Link>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden lg:flex">
        <div className="lg:w-1/2">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-8 lg:w-1/2">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          {product.category && (
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-4">
              {product.category}
            </span>
          )}
          <p className="text-gray-700 text-lg mb-6">{product.description}</p>
          <div className="flex items-center justify-between mb-8">
            <span className="text-3xl font-bold">${product.price}</span>
            <button
              onClick={handleAddToCart}
              className="bg-[#1a1a2e] text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-[#39ff14] hover:text-[#1a1a2e] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-3">Why You Need This</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Saves hours of debugging time</li>
              <li>Works with all major programming languages</li>
              <li>Increases your coding productivity</li>
              <li>Reduces frustration and stress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;