'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Send, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    created_at: string;
}

export default function SecretChatPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const [senderId, setSenderId] = useState('');

    // Scroll to bottom when messages update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Fetch initial messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('secret_chat_messages')
                .select('*')
                .order('created_at', { ascending: true });
            
            if (data) {
                const msgs = data.map(msg => ({
                    id: msg.id,
                    text: msg.text,
                    isUser: msg.sender_id === senderId,
                    created_at: msg.created_at
                } as Message));
                setMessages(msgs);
            }
        };

        fetchMessages();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('secret_chat_updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'secret_chat_messages',
                },
                (payload) => {
                    const newMsg = payload.new;
                    setMessages(prev => [...prev, {
                        id: newMsg.id,
                        text: newMsg.text,
                        isUser: newMsg.sender_id === senderId,
                        created_at: newMsg.created_at
                    } as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, senderId]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '6290' || password === '6299') {
            setSenderId(password); // Use the code itself as the identity
            setIsAuthenticated(true);
        } else {
            alert('Access Denied');
            setPassword('');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !senderId) return;

        try {
            const { error } = await supabase
                .from('secret_chat_messages')
                .insert({
                    text: newMessage,
                    sender_id: senderId
                }); // created_at is automatic in Supabase if defined as DEFAULT now()

            if (error) throw error;
            setNewMessage('');
        } catch (error: any) {
            console.error("Error sending message: ", error);
            alert(`Error sending message: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-mono">
            {!isAuthenticated ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
                     >
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Lock size={32} className="text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-bold text-center mb-2">SECURE_CHANNEL_V1</h2>
                        <p className="text-zinc-500 text-sm text-center mb-8">Establish secure connection authentication.</p>
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="ENTER_PASSKEY"
                                className="w-full bg-black border border-zinc-800 text-center text-white p-4 rounded-xl focus:outline-none focus:border-emerald-500 tracking-widest text-lg"
                                autoFocus
                            />
                            <button 
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-4 rounded-xl transition-all active:scale-95"
                            >
                                AUTHENTICATE
                            </button>
                        </form>
                     </motion.div>
                </div>
            ) : (
                <>
                    <header className="h-16 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 sm:px-6">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="font-bold tracking-wider text-sm sm:text-base">ENCRYPTED_CONNECTION</span>
                         </div>
                         <button 
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                         >
                             <LogOut size={20} />
                         </button>
                    </header>
                    
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-black/50 custom-scrollbar">
                         {messages.map((msg) => (
                            <motion.div 
                                key={msg.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 text-sm sm:text-base leading-relaxed ${
                                        msg.isUser 
                                            ? 'bg-emerald-600 text-white rounded-br-none' 
                                            : 'bg-zinc-800 text-zinc-300 rounded-bl-none border border-zinc-700'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={bottomRef} />
                    </main>

                    <footer className="p-4 bg-zinc-900 border-t border-zinc-800">
                         <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type encrypted message..."
                                className="flex-1 bg-black border border-zinc-700 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                            <button 
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 sm:p-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </footer>
                </>
            )}
        </div>
    );
}
