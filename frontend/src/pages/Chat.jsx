import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Send, Plus, Trash2, MessageSquare, Bot, User,
  Wrench, ChevronRight, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

// ─── Chat Sidebar ─────────────────────────────────────────────────
const ChatSidebar = () => {
  const { conversations, activeConversationId, loadMessages, newConversation, deleteConversation, loadConversations } = useChat();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNew = async () => {
    await newConversation();
  };

  return (
    <div className="w-64 flex flex-col border-r border-white/5 bg-dark-900/50 h-full shrink-0">
      <div className="p-3">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary-600/20 border border-primary-500/20 text-primary-400 hover:bg-primary-600/30 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 no-scrollbar">
        {conversations.length === 0 && (
          <div className="text-center py-8 text-white/20 text-xs">No conversations yet</div>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => loadMessages(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeConversationId === conv.id
                ? 'bg-primary-600/20 border border-primary-500/20'
                : 'hover:bg-white/5'
            }`}
          >
            <MessageSquare size={14} className="text-white/40 shrink-0" />
            <span className="text-xs text-white/70 truncate flex-1">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const toolsUsed = message.metadata?.toolsUsed || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-primary-600/40' : 'bg-white/10'
      }`}>
        {isUser ? <User size={14} className="text-primary-300" /> : <Bot size={14} className="text-white/60" />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool pills */}
        {toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {toolsUsed.map((t, i) => (
              <span key={i} className="tool-pill">
                <Wrench size={10} />
                {t.name.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className={isUser ? 'message-user' : 'message-ai'}>
          <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        <span className="text-xs text-white/25">
          {message.createdAt ? format(new Date(message.createdAt), 'h:mm a') : ''}
        </span>
      </div>
    </motion.div>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-3">
    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
      <Bot size={14} className="text-white/60" />
    </div>
    <div className="message-ai flex items-center gap-1.5 py-3">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);

// ─── Suggestion chips ─────────────────────────────────────────────
const SUGGESTIONS = [
  'Send an email to team@company.com about the meeting',
  'Schedule a Google Meet for tomorrow at 3 PM',
  'Create a Google Sheet with sales data',
  'List my recent Google Drive files',
  'Create a Google Doc titled "Project Proposal"',
];

// ─── Main Chat Page ───────────────────────────────────────────────
const Chat = () => {
  const { messages, loading, sending, sendMessage, activeConversationId, newConversation } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let convId = activeConversationId;
    if (!convId) {
      const conv = await newConversation();
      convId = conv?.id;
    }

    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      <ChatSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20 animate-pulse-glow">
                <Bot size={32} className="text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">AI Assistant</h2>
                <p className="text-white/50 text-sm max-w-md">
                  I can send emails, schedule meetings, manage your Google Drive, create Sheets and Docs, send WhatsApp messages, and much more.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="glass-hover px-4 py-2 rounded-full text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight size={12} className="text-primary-400" />
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {sending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-white/5">
          <div className="relative glass rounded-2xl flex items-end gap-3 p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to send emails, schedule meetings, manage files..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none focus:outline-none py-2 px-3 max-h-32"
              rows={1}
              style={{ height: 'auto', minHeight: '40px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
            </button>
          </div>
          <p className="text-center text-xs text-white/20 mt-2">
            AI can send emails, create meetings, manage Drive, Sheets, Docs, and WhatsApp messages
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
