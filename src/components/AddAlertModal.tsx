import React, { useState } from 'react';
import { X, Bell, Target } from 'lucide-react';
import { CryptoPair, CustomAlert } from '../types';

interface AddAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: CryptoPair[];
  onAddAlert: (alert: CustomAlert) => void;
  darkMode: boolean;
}

export const AddAlertModal: React.FC<AddAlertModalProps> = ({
  isOpen,
  onClose,
  pairs,
  onAddAlert,
  darkMode
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(pairs[0]?.symbol || 'BTC');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const selectedPair = pairs.find(p => p.symbol === selectedSymbol) || pairs[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    const newAlert: CustomAlert = {
      id: `alert-${Date.now()}`,
      symbol: selectedPair.symbol,
      targetPrice: price,
      condition,
      createdAt: 'Just now',
      triggered: false,
      note: note || `Notify when ${selectedPair.symbol} goes ${condition} $${price.toLocaleString()}`
    };

    onAddAlert(newAlert);
    setTargetPrice('');
    setNote('');
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
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Set Price Breakout Alert</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">
              Pair
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
              Trigger Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition('above')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  condition === 'above'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Price Rises Above (≥)
              </button>
              <button
                type="button"
                onClick={() => setCondition('below')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  condition === 'below'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Price Drops Below (≤)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">
              Target Price (USD)
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder={`Current: $${selectedPair.price.toLocaleString()}`}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className={`w-full p-2.5 rounded-xl border font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1.5 font-bold uppercase tracking-wider text-[10px]">
              Alert Note / Strategy (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Take profit 25% or Retest order block"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm shadow-blue-600/30"
            >
              Create Real-Time Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
