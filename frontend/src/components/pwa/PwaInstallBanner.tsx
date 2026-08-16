import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { Download, Smartphone, Laptop, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const { installPrompt, triggerInstall, hasUpdate, applyUpdate } = usePWA();
  const [dismissed, setDismissed] = React.useState<boolean>(false);

  if (hasUpdate) {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-lg">
        <span className="font-semibold">A new version of TechBridge is available!</span>
        <button
          onClick={applyUpdate}
          className="bg-slate-900 text-white font-bold px-3 py-1 rounded-lg text-[11px] hover:bg-slate-800 transition"
        >
          Update Now
        </button>
      </div>
    );
  }

  if (!installPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 right-4 z-40 max-w-sm bg-slate-900/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            TB
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install TechBridge PWA</h4>
            <p className="text-[11px] text-slate-400">Install on Android, iPhone, Windows, or Mac for offline access</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          Not now
        </button>
        <button
          onClick={triggerInstall}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-md shadow-blue-600/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      </div>
    </div>
  );
};
