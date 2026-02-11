
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
  onRemove: () => void;
  cartQuantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, onRemove, cartQuantity }) => {
  return (
    <div className="bg-white border rounded-xl p-3 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="relative mb-2">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full aspect-square object-cover rounded-lg"
        />
        {product.discount > 0 && (
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg rounded-br-lg uppercase">
            {product.discount}% OFF
          </div>
        )}
        <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium">
          ETA: 12 mins
        </div>
      </div>

      <div className="flex-grow">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{product.unit}</p>
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight h-10">{product.name}</h3>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-black">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
        </div>

        {cartQuantity > 0 ? (
          <div className="flex items-center bg-green-600 text-white rounded-lg h-8 px-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-7 h-7 flex items-center justify-center font-bold text-lg hover:bg-green-700 rounded"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold">{cartQuantity}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="w-7 h-7 flex items-center justify-center font-bold text-lg hover:bg-green-700 rounded"
              disabled={product.stock <= cartQuantity}
            >
              +
            </button>
          </div>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={product.stock === 0}
            className={`h-8 px-4 border border-green-600 text-green-600 rounded-lg text-sm font-bold hover:bg-green-50 transition-colors ${product.stock === 0 ? 'opacity-50 cursor-not-allowed border-gray-400 text-gray-400' : ''}`}
          >
            {product.stock === 0 ? 'Out of Stock' : 'ADD'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
