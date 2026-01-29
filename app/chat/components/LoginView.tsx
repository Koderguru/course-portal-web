'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { authenticate } from '../actions';

interface LoginViewProps {
    onLoginSuccess: (userId: string) => void;
}

export const LoginView = ({ onLoginSuccess }: LoginViewProps) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await authenticate(password);
            if (result.success && result.userId) {
                // Set session flag purely for client-side lifecycle management (tab close detection)
                sessionStorage.setItem('chat_session_active', 'true');
                onLoginSuccess(result.userId);
            } else {
                alert(result.message);
                setPassword('');
            }
        } catch (error) {
            console.error("Login failed", error);
            alert("Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
             >
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 mx-auto relative group">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all"></div>
                    <Lock size={32} className="text-emerald-500 relative z-10" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2 font-mono text-zinc-100">SECURE_CHANNEL_V1</h2>
                <p className="text-zinc-500 text-sm text-center mb-8 font-mono">Establish secure connection authentication.</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ENTER_PASSKEY"
                        className="w-full bg-black border border-zinc-800 text-center text-white p-4 rounded-xl focus:outline-none focus:border-emerald-500 tracking-widest text-lg font-mono transition-colors"
                        autoFocus
                        disabled={loading}
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold p-4 rounded-xl transition-all active:scale-95 font-mono shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
                    </button>
                </form>
             </motion.div>
        </div>
    );
};
