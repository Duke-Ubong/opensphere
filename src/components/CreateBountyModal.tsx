import React, { useState } from 'react';
import { X, DollarSign, Briefcase } from 'lucide-react';

interface CreateBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBountyCreated: (bounty: { title: string; desc: string; price: string; currency: string }) => void;
}

export default function CreateBountyModal({ isOpen, onClose, onBountyCreated }: CreateBountyModalProps) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USDC');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || !price.trim()) return;
    
    onBountyCreated({
      title,
      desc,
      price: `$${price}`,
      currency
    });
    
    setTitle('');
    setDesc('');
    setPrice('');
    setCurrency('USDC');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-surface border border-outline-variant/20 rounded-t-xl sm:rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h3 className="font-headline font-bold text-lg text-primary tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary-container" />
            Post New Bounty
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block font-label text-[10px] text-secondary uppercase tracking-widest mb-2">Bounty Title</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart Contract Audit"
              className="w-full bg-surface-container p-3 rounded border border-outline-variant/20 text-on-surface font-body text-sm focus:outline-none focus:border-primary-container"
            />
          </div>
          
          <div>
            <label className="block font-label text-[10px] text-secondary uppercase tracking-widest mb-2">Description</label>
            <textarea 
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the requirements..."
              className="w-full bg-surface-container p-3 rounded border border-outline-variant/20 text-on-surface font-body text-sm focus:outline-none focus:border-primary-container min-h-[100px]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-label text-[10px] text-secondary uppercase tracking-widest mb-2">Reward Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-outline" />
                </div>
                <input 
                  required
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-surface-container pl-9 p-3 rounded border border-outline-variant/20 text-on-surface font-body text-sm focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>
            <div className="w-1/3">
              <label className="block font-label text-[10px] text-secondary uppercase tracking-widest mb-2">Currency</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-surface-container p-3 rounded border border-outline-variant/20 text-on-surface font-body text-sm focus:outline-none focus:border-primary-container appearance-none"
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="USD">USD</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded font-label uppercase tracking-widest text-xs font-bold bg-surface-container text-secondary hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded font-label uppercase tracking-widest text-xs font-bold bg-primary-container text-on-primary-container hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,255,170,0.2)]"
            >
              Post Bounty
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
