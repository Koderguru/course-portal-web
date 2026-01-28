'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { getInitialMessages, checkSession, logout } from './actions';
import { LoginView } from './components/LoginView';
import { ChatView } from './components/ChatView';

interface Message {
    id: string;
    text: string;
    image_url?: string;
    audio_url?: string;
    isUser: boolean;
    created_at: string;
    sender_id?: string;
}

export default function SecretChatPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [senderId, setSenderId] = useState('');
    const [loading, setLoading] = useState(true);

    // Check existing session on mount
    useEffect(() => {
        checkSession().then(session => {
            if (session.isAuthenticated && session.userId) {
                setSenderId(session.userId);
                setIsAuthenticated(true);
            }
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !senderId) return;

        // Fetch initial messages
        getInitialMessages().then(msgs => {
            setMessages(msgs.map(m => ({
                 ...m,
                 isUser: m.sender_id === senderId 
            })));
        });

        // Subscribe to real-time changes
        const channel = supabase
            .channel('secret_chat_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'secret_chat_messages',
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    
                    if (payload.eventType === 'INSERT') {
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, {
                                id: newMsg.id,
                                text: newMsg.text,
                                image_url: newMsg.image_url,
                                audio_url: newMsg.audio_url,
                                isUser: newMsg.sender_id === senderId,
                                created_at: newMsg.created_at
                            } as Message];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(prev => prev.map(msg => 
                            msg.id === newMsg.id ? { ...msg, text: newMsg.text } : msg
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, senderId]);

    const handleLoginSuccess = (userId: string) => {
        setSenderId(userId);
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        await logout();
        setIsAuthenticated(false);
        setSenderId('');
        router.push('/');
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500 font-mono">INITIALIZING_SECURE_LINK...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-mono">
            {!isAuthenticated ? (
                <LoginView onLoginSuccess={handleLoginSuccess} />
            ) : (
                <ChatView 
                    messages={messages} 
                    senderId={senderId} 
                    onLogout={handleLogout} 
                />
            )}
        </div>
    );
}
