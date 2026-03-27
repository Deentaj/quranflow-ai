import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/streak-utils';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, LoadingSpinner } from '@/components/UIStates';
import { Send, MessageCircle, Bookmark, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  bookmarked?: boolean;
}

const SUGGESTED_PROMPTS = [
  'I feel stressed. Give me a verse for comfort.',
  'How can I stay consistent after Ramadan?',
  'Explain Surah Al-Fatiha simply.',
  'Give me a verse for motivation today.',
  'What should I read when feeling disconnected?',
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHistory(); }, [user]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) {
      const msgs: ChatMessage[] = [];
      data.forEach(chat => {
        msgs.push({ id: chat.id, role: 'user', content: chat.user_message });
        msgs.push({ id: chat.id, role: 'assistant', content: chat.ai_response, bookmarked: chat.bookmarked || false });
      });
      setMessages(msgs);
    }
    setHistoryLoading(false);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || !user) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const conversationContext = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      conversationContext.push({ role: 'user', content: messageText });

      const response = await supabase.functions.invoke('ai-companion', {
        body: { messages: conversationContext },
      });

      if (response.error) throw new Error(response.error.message);
      
      const aiContent = response.data?.content || response.data?.choices?.[0]?.message?.content || 'I apologize, I was unable to generate a response. Please try again.';
      
      const assistantMsg: ChatMessage = { role: 'assistant', content: aiContent };
      setMessages(prev => [...prev, assistantMsg]);

      await supabase.from('ai_chats').insert([{
        user_id: user.id,
        user_message: messageText,
        ai_response: aiContent,
      }]);

      await logActivity(user.id, 'ai_used');
    } catch (error) {
      toast.error('Failed to get AI response. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (msg: ChatMessage) => {
    if (!user || !msg.id) return;
    await supabase.from('ai_chats').update({ bookmarked: true }).eq('id', msg.id);
    
    await supabase.from('bookmarks').insert([{
      user_id: user.id,
      type: 'ai_response',
      reference: msg.id,
      content: { text: msg.content } as unknown as import('@/integrations/supabase/types').Json,
    }]);
    
    toast.success('AI guidance bookmarked.');
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
        <div className="mb-4">
          <h1 className="font-heading text-3xl font-bold text-foreground">QuranFlow Companion</h1>
          <p className="text-muted-foreground text-sm mt-1">Your gentle AI spiritual guide</p>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {historyLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : messages.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                icon={<Sparkles className="h-12 w-12" />}
                title="Begin a conversation"
                description="Ask for Qur'anic guidance, verse explanations, or spiritual support."
              />
              <div className="space-y-2">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left px-4 py-3 rounded-2xl border border-border bg-card text-sm text-foreground hover:border-primary/30 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'glass-card'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && (
                    <button onClick={() => handleBookmark(msg)} className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <Bookmark className="h-3 w-3" /> Save
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="glass-card rounded-2xl px-4 py-3">
                <LoadingSpinner className="h-4 w-4" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mb-2">
          For deeper religious rulings, please consult a qualified scholar.
        </p>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask for Qur'anic guidance..."
            className="rounded-xl"
            disabled={loading}
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
