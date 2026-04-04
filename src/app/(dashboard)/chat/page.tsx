'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowUp, MessageCircle, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PageTransition } from '@/components/ui/page-transition';
import { cn } from '@/lib/cn';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'How can I improve my resume for senior roles?',
  'Rewrite my weakest bullet to sound more impactful',
  'What skills am I missing for a PM role?',
  'Write a cover letter for a startup CTO position',
  'Rate my resume summary and suggest improvements',
  'How should I explain a career gap?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: content.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      setIsLoading(true);
    }, 400);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), conversationHistory: messages }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  };

  return (
    <PageTransition>
      <div className="relative flex h-[calc(100vh-7rem)] w-full flex-col overflow-hidden">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -bottom-[10%] left-1/2 h-[30%] w-[100%] -translate-x-1/2 bg-brand-100/20 blur-[120px]" />
        </div>

        {/* Scrollable messages */}
        <div ref={scrollRef} className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 scrollbar-thin">
          <div className="flex-grow" />
          <div className="mx-auto w-full max-w-2xl space-y-6 py-10">
            {/* Empty state: suggested prompts */}
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center pt-20">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                  <MessageCircle className="w-7 h-7 text-brand-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">AI Career Coach</h2>
                <p className="text-sm text-gray-500 mb-8 text-center max-w-sm">I know your resume, skills, and career history. Ask me anything.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button key={prompt} onClick={() => sendMessage(prompt)}
                      className="text-left text-xs p-3.5 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-gray-600 hover:text-gray-900 leading-relaxed">
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
                >
                  <div className={cn(
                    'max-w-[85%] rounded-[14px] px-5 py-3 text-[15px] leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'rounded-br-none border border-gray-200 bg-gray-100 text-gray-800'
                      : 'border border-gray-100 bg-gray-50 text-gray-700'
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-p:mb-2 prose-p:mt-0 prose-headings:mb-2 prose-headings:mt-3 prose-li:mb-0.5 prose-code:bg-gray-200 prose-code:rounded prose-code:px-1 prose-code:text-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex h-6 items-center gap-1.5 px-4">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* ── AiInput003-style input bar ── */}
        <div className="relative z-20 flex w-full items-center justify-center px-4 pt-4 pb-6">
          <motion.div
            animate={{
              scale: isSending ? 0.985 : 1,
              boxShadow: isSending ? '0 0 18px rgba(124,58,237,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="group relative flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-gray-200 bg-white px-5 py-2.5 pr-3 transition-colors hover:border-gray-300 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100"
          >
            {isSending && (
              <motion.div
                initial={{ y: '220%' }}
                animate={{ y: '-120%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-0 z-0 skew-x-12 bg-gradient-to-t from-brand-500/15 via-brand-500/5 to-transparent blur-md"
              />
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about your resume, career, or a job..."
              className="z-10 flex-1 border-none bg-transparent py-2 text-[15px] font-medium text-gray-900 placeholder-gray-400 outline-none"
              autoFocus
            />

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className={cn(
                'z-10 ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                input.trim()
                  ? 'bg-gray-900 text-white shadow-sm active:scale-95'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              <ArrowUp size={18} strokeWidth={3} />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
