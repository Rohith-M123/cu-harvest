
import React, { useState } from 'react';
import { Product } from '../../types';

interface InventoryManagerProps {
  products: Product[];
  updateProduct: (p: Product) => void;
  addProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  categories: any[];
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, updateProduct, addProduct, deleteProduct, categories = [] }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData(p);
  };

  const handleSave = () => {
    if (editingId) {
      updateProduct(formData as Product);
      setEditingId(null);
    } else {
      const newP = {
        ...formData,
        id: `p${Date.now()}`,
        image: formData.image || 'https://picsum.photos/300/300'
      } as Product;
      addProduct(newP);
      setShowAddForm(false);
    }
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">Inventory Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Add/Edit Modal (Simplified as inline for demo) */}
      {(showAddForm || editingId) && (
        <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-lg">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Product Name"
              className="border p-2 rounded-lg"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <select
              className="border p-2 rounded-lg bg-white"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="Unit (e.g., 500g, 1kg)"
              className="border p-2 rounded-lg"
              value={formData.unit || ''}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              className="border p-2 rounded-lg"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Original Price"
              className="border p-2 rounded-lg"
              value={formData.originalPrice || ''}
              onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              className="border p-2 rounded-lg"
              value={formData.stock || ''}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
            />
            <input
              placeholder="Image URL/Path (e.g. /apple.jpg)"
              className="border p-2 rounded-lg md:col-span-3"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setEditingId(null); setShowAddForm(false); setFormData({}); }}
              className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg"
            >
              Save Product
            </button>
          </div>
        </div>
      )}

      {/* Product List Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-sm text-gray-800">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-lg text-gray-600">{p.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm">₹{p.price}</p>
                    {p.discount > 0 && <p className="text-[10px] text-blue-600 font-bold">{p.discount}% OFF</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono font-bold ${p.stock < 20 ? 'text-red-600' : 'text-gray-800'}`}>{p.stock}</span>
                  </td>
                  <td className="px-6 py-4">
                    {p.stock > 0 ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                        Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
