'use client';

import { useState, useRef, useEffect, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Minus, Mail, Smile, Paperclip, Wand2, MoreHorizontal, Bold, Italic, Check, Copy, Heart,
} from 'lucide-react';

export interface EmailCardData {
  from: { name: string; email: string };
  to: { name: string; email: string };
  subject: string;
  body: string;
  tone: string;
}

interface ComposeEmailCardProps {
  data: EmailCardData;
  onSend?: () => void;
  onCopy?: () => void;
  onClose?: () => void;
  onFavorite?: () => void;
  isSending?: boolean;
  canSend?: boolean;
  isFavorite?: boolean;
}

export const ComposeEmailCard: FC<ComposeEmailCardProps> = ({
  data, onSend, onCopy, onClose, onFavorite, isSending, canSend, isFavorite,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${data.subject}\n\n${data.body}`);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const toneColor = data.tone === 'professional' ? 'bg-blue-50 text-blue-600 border-blue-200'
    : data.tone === 'conversational' ? 'bg-amber-50 text-amber-600 border-amber-200'
    : 'bg-purple-50 text-purple-600 border-purple-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-[#F8F8FA] shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-4 bg-[#F8F8FA]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Mail size={16} strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold text-gray-900">Email Draft</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${toneColor} capitalize`}>
            {data.tone.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 transition">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200/80 bg-white mx-1 mb-1">
        <div className="px-5 pt-4 pb-2 space-y-2 text-sm">
          {/* From/To/Subject */}
          <div className="flex items-center gap-3 text-gray-500 border-b border-gray-100 pb-2">
            <span className="w-12 text-xs text-gray-400">From</span>
            <span className="font-medium text-gray-700">{data.from.name}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 border-b border-gray-100 pb-2">
            <span className="w-12 text-xs text-gray-400">To</span>
            <span className="font-medium text-gray-700">{data.to.name}</span>
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
            <span className="w-12 text-xs text-gray-400">Subject</span>
            <span className="font-medium text-gray-900">{data.subject}</span>
          </div>
        </div>

        {/* Email body */}
        <div className="px-5 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
          {data.body}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F8F8FA]">
        <div className="flex items-center gap-1 text-gray-400">
          {onFavorite && (
            <button
              onClick={onFavorite}
              className={`rounded-lg p-1.5 transition ${isFavorite ? 'text-red-500' : 'hover:text-red-400'}`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
            </button>
          )}
          <button className="rounded-lg p-1.5 hover:text-gray-600 transition"><Wand2 size={16} /></button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
          </button>
          {canSend && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSend}
              disabled={isSending}
              className="flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white shadow-md hover:bg-gray-800 transition disabled:opacity-50"
            >
              <Mail size={13} /> {isSending ? 'Sending...' : 'Send'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ComposeEmailCard;
