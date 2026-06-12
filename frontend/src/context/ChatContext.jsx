import { createContext, useContext, useState, useCallback } from 'react';
import { chatAPI } from '../api/chat.api';
import toast from 'react-hot-toast';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await chatAPI.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    setLoading(true);
    try {
      const data = await chatAPI.getMessages(conversationId);
      setMessages(data);
      setActiveConversationId(conversationId);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new conversation
  const newConversation = useCallback(async () => {
    try {
      const conv = await chatAPI.createConversation('New Chat');
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
      return conv;
    } catch {
      toast.error('Failed to create conversation');
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content) => {
    if (!activeConversationId) return;
    setSending(true);

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const data = await chatAPI.sendMessage(activeConversationId, content);

      // Replace temp with real + add assistant response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMsg.id),
        { id: `user-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() },
        data.message,
      ]);

      // Update conversation title if changed
      await loadConversations();

      return data;
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [activeConversationId, loadConversations]);

  // Delete conversation
  const deleteConversation = useCallback(async (id) => {
    try {
      await chatAPI.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch {
      toast.error('Failed to delete conversation');
    }
  }, [activeConversationId]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        messages,
        loading,
        sending,
        loadConversations,
        loadMessages,
        newConversation,
        sendMessage,
        deleteConversation,
        setActiveConversationId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export default ChatContext;
