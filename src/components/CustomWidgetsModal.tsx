import React from 'react';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';
import { WidgetConfig } from '../types';

interface CustomWidgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggleWidget: (id: string) => void;
  onResetWidgets: () => void;
  darkMode: boolean;
}

export const CustomWidgetsModal: React.FC<CustomWidgetsModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onResetWidgets,
  darkMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Customize Dashboard Widgets</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailor your professional trading workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Widgets */}
        <div className="p-6 space-y-3">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              onClick={() => onToggleWidget(widget.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                widget.enabled
                  ? darkMode 
                    ? 'border-blue-500/60 bg-blue-950/30' 
                    : 'border-blue-200 bg-blue-50/50'
                  : 'border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {widget.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {widget.description}
                </span>
              </div>

              <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                widget.enabled ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-700'
              }`}>
                {widget.enabled && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={onResetWidgets}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
          >
            Save Layout
          </button>
        </div>
      </div>
    </div>
  );
};
