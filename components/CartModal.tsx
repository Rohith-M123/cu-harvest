
import React, { useState } from 'react';
import { CartItem } from '../types';

interface CartModalProps {
  cart: CartItem[];
  onClose: () => void;
  onAdd: (p: any) => void;
  onRemove: (id: string) => void;
  placeOrder: (addr: string, paymentMethod: string, verificationContact: string, deliveryLocation?: {latitude: number, longitude: number}) => void;
  addresses: string[];
}

const CartModal: React.FC<CartModalProps> = ({ cart, onClose, onAdd, onRemove, placeOrder, addresses }) => {
  const [step, setStep] = useState<'cart' | 'address' | 'scheduling' | 'payment'>('cart');
  const [selectedAddress, setSelectedAddress] = useState((addresses && addresses[0]) || '');
  const [isLocating, setIsLocating] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<{latitude: number, longitude: number} | undefined>(undefined);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [verificationContact, setVerificationContact] = useState('');

  // Scheduling State
  const [deliveryType, setDeliveryType] = useState<'INSTANT' | 'SCHEDULED'>('INSTANT');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliverySlot, setDeliverySlot] = useState<'MORNING' | 'AFTERNOON' | 'EVENING'>('MORNING');

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = cartTotal > 500 ? 0 : 25;
  const handlingFee = 5;
  const grandTotal = cartTotal + deliveryFee + handlingFee;

  const handleGeolocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        // Mocking address conversion from lat/lng
        const mockAddr = `centurion university vizianagaram,rollavaka,vizianagaram,535003 (${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`;
        setManualAddress(mockAddr);
        setDeliveryLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
      }, () => {
        alert("Unable to retrieve location");
        setIsLocating(false);
      });
    } else {
      alert("Geolocation not supported");
      setIsLocating(false);
    }
  };

  const handlePlaceOrder = () => {
    const finalAddress = manualAddress || selectedAddress;
    if (!finalAddress) {
      alert("Please provide a delivery address");
      return;
    }

    // Validate Contact
    if (!verificationContact.trim()) {
      alert("Please provide an email or phone number for verification.");
      return;
    }

    placeOrder(
        finalAddress, 
        paymentMethod, 
        `Contact: ${verificationContact}`, 
        deliveryLocation,
        {
            deliveryType,
            deliveryDate: deliveryType === 'SCHEDULED' ? deliveryDate : undefined,
            deliverySlot: deliveryType === 'SCHEDULED' ? deliverySlot : undefined,
        }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:max-w-md max-h-[90vh] md:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-bold">
              {step === 'cart' ? 'My Cart' : step === 'address' ? 'Delivery Address' : 'Payment'}
            </h2>
          </div>
          {step === 'cart' && <span className="text-xs font-medium text-gray-500">{cart.length} Items</span>}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-4">
          {step === 'cart' && (
            <>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border-b last:border-0">
                    <img src={item.image} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold leading-tight">{item.name}</h4>
                      <p className="text-xs text-gray-500 mb-1">{item.unit}</p>
                      <p className="text-sm font-bold">₹{item.price}</p>
                    </div>
                    <div className="flex items-center bg-green-600 text-white rounded-lg h-8 px-1">
                      <button onClick={() => onRemove(item.id)} className="w-6 h-6 flex items-center justify-center font-bold">-</button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => onAdd(item)} className="w-6 h-6 flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
                <h3 className="text-sm font-bold mb-3">Bill Details</h3>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Item Total</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-bold' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Handling Fee</span>
                  <span>₹{handlingFee}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </>
          )}

          {step === 'address' && (
            <div className="space-y-4">
              <button
                onClick={handleGeolocation}
                disabled={isLocating}
                className="w-full bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-700 font-bold"
              >
                <svg className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {isLocating ? 'Locating...' : 'Use Current GPS Location'}
              </button>

              <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saved Addresses</p>
                {addresses.map((addr, idx) => (
                  <label key={idx} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === addr}
                      onChange={() => setSelectedAddress(addr)}
                      className="mt-1 text-green-600"
                    />
                    <span className="text-sm">{addr}</span>
                  </label>
                ))}
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Address</p>
                <textarea
                  placeholder="Flat No, Floor, Building, Area..."
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 'scheduling' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                <h3 className="font-bold text-lg">Delivery Options</h3>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setDeliveryType('INSTANT')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryType === 'INSTANT' ? 'border-green-600 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                        <span className="text-2xl">⚡</span>
                        <span className="font-bold text-sm">Instant</span>
                        <span className="text-[10px] text-gray-400">30-60 mins</span>
                    </button>
                    <button 
                        onClick={() => setDeliveryType('SCHEDULED')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryType === 'SCHEDULED' ? 'border-green-600 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                        <span className="text-2xl">📅</span>
                        <span className="font-bold text-sm">Schedule</span>
                        <span className="text-[10px] text-gray-400">Next 7 days</span>
                    </button>
                </div>

                {deliveryType === 'SCHEDULED' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Select Date</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[...Array(7)].map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + i);
                                    const dateStr = d.toISOString().split('T')[0];
                                    const isSelected = deliveryDate === dateStr;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setDeliveryDate(dateStr)}
                                            className={`flex-shrink-0 w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${isSelected ? 'border-green-600 bg-green-600 text-white' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                        >
                                            <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <span className="text-xl font-black">{d.getDate()}</span>
                                            <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Select Time Slot</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'MORNING', label: 'Morning', time: '7 AM – 11 AM', icon: '🌅' },
                                    { id: 'AFTERNOON', label: 'Afternoon', time: '12 PM – 4 PM', icon: '☀️' },
                                    { id: 'EVENING', label: 'Evening', time: '5 PM – 9 PM', icon: '🌙' }
                                ].map((slot) => (
                                    <button
                                        key={slot.id}
                                        onClick={() => setDeliverySlot(slot.id as any)}
                                        className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${deliverySlot === slot.id ? 'border-green-600 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{slot.icon}</span>
                                            <div className="text-left">
                                                <p className="font-bold text-sm text-gray-800">{slot.label}</p>
                                                <p className="text-[10px] text-gray-400">{slot.time}</p>
                                            </div>
                                        </div>
                                        {deliverySlot === slot.id && <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold">Select Payment Mode</h3>

                {/* Contact Verification */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="Enter 10-digit number"
                    value={verificationContact}
                    onChange={(e) => setVerificationContact(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                  <p className="text-[10px] text-gray-400">We will use this to contact you for delivery.</p>
                </div>

                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer ${paymentMethod === 'UPI' ? 'border-green-600 bg-green-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setPaymentMethod('UPI')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">UPI</div>
                      <div>
                        <p className="font-bold text-sm">UPI Payment</p>
                        <p className="text-xs text-gray-400">Scan QR to Pay</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 border-2 ${paymentMethod === 'UPI' ? 'border-green-600' : 'border-gray-300'} rounded-full flex items-center justify-center p-0.5`}>
                      {paymentMethod === 'UPI' && <div className="w-full h-full bg-green-600 rounded-full"></div>}
                    </div>
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div className="p-4 border border-dashed border-green-300 rounded-xl bg-green-50 flex flex-col items-center justify-center space-y-2">
                      <p className="text-xs font-bold text-green-800">Scan & Pay</p>
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        {/* Placeholder for QR Code - User needs to place 'phonepe-qr.jpg' in public/assets or public folder */}
                        <img src="/phonepe-qr.jpg" alt="UPI QR Code" className="w-48 h-48 object-contain" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/200?text=QR+Code+Missing'} />
                      </div>
                      <p className="text-xs font-bold text-gray-600">mollirohith@ybl</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-xl opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">CC</div>
                      <div>
                        <p className="font-bold text-sm">Credit / Debit Card</p>
                        <p className="text-xs text-gray-400">Visa, Mastercard, RuPay</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer ${paymentMethod === 'COD' ? 'border-green-600 bg-green-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setPaymentMethod('COD')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">COD</div>
                      <div>
                        <p className="font-bold text-sm">Cash on Delivery</p>
                        <p className="text-xs text-gray-400">Pay on delivery</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 border-2 ${paymentMethod === 'COD' ? 'border-green-600' : 'border-gray-300'} rounded-full flex items-center justify-center p-0.5`}>
                      {paymentMethod === 'COD' && <div className="w-full h-full bg-green-600 rounded-full"></div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t space-y-3">
          <div className="flex justify-between items-center px-1">
            <div>
              <p className="text-xs text-gray-500 font-medium">To Pay</p>
              <p className="text-xl font-black">₹{grandTotal}</p>
            </div>
            {step === 'cart' && (
              <div className="text-right">
                <p className="text-xs text-green-600 font-bold">SAVING ₹30</p>
                <p className="text-[10px] text-gray-400">including coupon discounts</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (step === 'cart') setStep('address');
              else if (step === 'address') setStep('scheduling');
              else if (step === 'scheduling') setStep('payment');
              else handlePlaceOrder();
            }}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            {step === 'cart' ? 'Proceed to Address' : step === 'address' ? 'Proceed to Schedule' : step === 'scheduling' ? 'Proceed to Payment' : `Place Order`}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
