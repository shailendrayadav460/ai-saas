import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Image as ImageIcon, Lock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../api/axios';
import toast from 'react-hot-toast';

const WhatsApp = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputStr, setInputStr] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (user?.plan === 'PRO') {
      fetchLogs();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/whatsapp/logs');
      setMessages(res.data.data.reverse()); // old to new
    } catch (err) {
      toast.error('Failed to load WhatsApp logs');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!toNumber) {
      return toast.error('Please enter a recipient phone number');
    }
    if (!inputStr.trim() && !mediaUrl.trim()) return;

    setLoading(true);
    try {
      await api.post('/whatsapp/send', {
        to: toNumber,
        message: inputStr,
        mediaUrl: mediaUrl || undefined
      });
      toast.success('Message sent');
      setInputStr('');
      setMediaUrl('');
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (user?.plan !== 'PRO') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">PRO Feature Locked</h2>
        <p className="text-white/60 max-w-md mb-6">
          The WhatsApp integration is only available on the PRO plan. Upgrade your plan to send and receive WhatsApp messages directly from this dashboard.
        </p>
        <Button onClick={() => window.location.href = '/subscription'}>Upgrade to PRO</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-900 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-white font-semibold">WhatsApp Manager</h2>
            <p className="text-xs text-white/50">Send & receive messages via Twilio Sandbox</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <Phone className="w-8 h-8 mb-2 opacity-50" />
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.direction === 'OUTBOUND' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white/40">
                  {msg.direction === 'OUTBOUND' ? `To: ${msg.to}` : `From: ${msg.from}`}
                </span>
              </div>
              <div className={`p-3 rounded-2xl ${msg.direction === 'OUTBOUND' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-dark-800 border border-white/10 text-white/90 rounded-bl-none'}`}>
                {msg.mediaUrl && (
                  <div className="mb-2">
                    {msg.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                      <img src={msg.mediaUrl} alt="Media" className="max-w-xs rounded-lg" />
                    ) : (
                      <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="text-emerald-300 underline text-sm flex items-center gap-1">
                        <ImageIcon size={14} /> View Media
                      </a>
                    )}
                  </div>
                )}
                {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
              </div>
              <span className="text-[10px] text-white/30 mt-1">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-dark-800 border-t border-white/5">
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Recipient Number (e.g. +919876543210)"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Media URL (Optional Image/Video link)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                placeholder="Type a message..."
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="shrink-0 h-[42px] px-6">
              {loading ? 'Sending...' : (
                <>
                  <Send size={16} /> Send
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsApp;
