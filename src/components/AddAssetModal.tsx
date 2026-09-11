import React, { useState } from 'react';
import { X, PlusCircle, DollarSign } from 'lucide-react';
import { CryptoPair, PortfolioAsset } from '../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: CryptoPair[];
  onAddAsset: (asset: PortfolioAsset) => void;
  darkMode: boolean;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  pairs,
  onAddAsset,
  darkMode
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(pairs[0]?.symbol || 'BTC');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  if (!isOpen) return null;

  const selectedPair = pairs.find(p => p.symbol === selectedSymbol) || pairs[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(buyPrice) || selectedPair.price;

    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newAsset: PortfolioAsset = {
      id: `p-${Date.now()}`,
      symbol: selectedPair.symbol,
      name: selectedPair.name,
      amount: parsedAmount,
      buyPrice: parsedPrice,
      buyDate: new Date().toISOString().split('T')[0]
    };

    onAddAsset(newAsset);
    setAmount('');
    setBuyPrice('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-900'
      }`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Add Portfolio Position</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">
              Select Crypto Asset
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {pairs.map(p => (
                <option key={p.symbol} value={p.symbol}>
                  {p.name} ({p.symbol}) — Live ${p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">
              Quantity / Holding Amount
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 1.25"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">
              Purchase Price (USD)
            </label>
            <input
              type="number"
              step="any"
              placeholder={`Current market: $${selectedPair.price.toLocaleString()}`}
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm shadow-blue-600/30"
            >
              Add to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
