import React, { useState } from 'react';
import { X, Plus, Trash2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (lounge: any) => void;
}

const CreateLoungeModal: React.FC<CreateLoungeModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [skills, setSkills] = useState([{ name: '', threshold: 50 }]);
  const [isTemporary, setIsTemporary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSkill = () => {
    setSkills([...skills, { name: '', threshold: 50 }]);
  };

  const handleUpdateSkill = (index: number, field: 'name' | 'threshold', value: string | number) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setSkills(newSkills);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    const skill_thresholds = skills.reduce((acc, skill) => {
      if (skill.name.trim()) {
        acc[skill.name.trim()] = Number(skill.threshold);
      }
      return acc;
    }, {} as Record<string, number>);

    try {
      const response = await fetch('/api/create_lounge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          skill_thresholds,
          is_temporary: isTemporary
        })
      });
      
      if (response.ok) {
        const newLounge = await response.json();
        onCreated(newLounge);
        setName('');
        setSkills([{ name: '', threshold: 50 }]);
        setIsTemporary(false);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create lounge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          className="relative w-full max-w-lg bg-[#111111] border border-[#D4AF37]/30 rounded-t-2xl sm:rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20 bg-[#111111]">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-white tracking-wider">Initialize Lounge</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <form id="create-lounge-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Lounge Designation</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Core Architecture Sync"
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Skill-Gate Thresholds</label>
                <p className="text-xs text-gray-500 mb-4">Define the expertise required to enter this environment.</p>
                
                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => handleUpdateSkill(index, 'name', e.target.value)}
                        placeholder="Skill (e.g., System Design)"
                        className="flex-1 bg-[#0A0A0A] border border-gray-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                        required
                      />
                      <div className="flex items-center gap-2 bg-[#0A0A0A] border border-gray-800 rounded-lg p-3 w-32">
                        <span className="text-xs text-gray-500">Lv.</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={skill.threshold}
                          onChange={(e) => handleUpdateSkill(index, 'threshold', parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent text-white text-sm focus:outline-none text-right"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        disabled={skills.length === 1}
                        className="p-3 text-gray-600 hover:text-red-500 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="mt-3 flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-widest hover:text-[#F3E5AB] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Skill Requirement
                </button>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-1">
                    <input
                      type="checkbox"
                      checked={isTemporary}
                      onChange={(e) => setIsTemporary(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${isTemporary ? 'bg-red-500/20 border border-red-500/50' : 'bg-gray-800 border border-gray-700'}`}></div>
                    <div className={`absolute left-1 w-4 h-4 rounded-full transition-transform ${isTemporary ? 'bg-red-500 translate-x-4' : 'bg-gray-500'}`}></div>
                  </div>
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-widest ${isTemporary ? 'text-red-500' : 'text-gray-300'}`}>Off-The-Record (OTR) Session</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">If enabled, this lounge operates as a "burn-on-close" room. All messages and metadata will be permanently purged upon session termination.</p>
                  </div>
                </label>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-[#D4AF37]/20 bg-[#111111] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-lounge-form"
              disabled={isSubmitting || !name.trim() || skills.some(s => !s.name.trim())}
              className="px-6 py-3 bg-[#D4AF37] text-black rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#F3E5AB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              {isSubmitting ? 'Initializing...' : 'Establish Lounge'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateLoungeModal;
