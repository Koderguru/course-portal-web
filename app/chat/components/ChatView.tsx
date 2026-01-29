'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, LogOut, Image as ImageIcon, Smile, X, Loader2, Mic, Square, Trash2, Pencil, Check, Palette, Camera, Plus, Video, Phone, ChevronLeft, MoreVertical, Search, Gift } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { sendMessage, updateMessage, deleteMessageForEveryone, deleteMessageForMe, clearChat } from '../actions';
import { supabase } from '@/app/lib/supabaseClient';

const GIPHY_API_KEY = 'j5tfevMpOG5akj5A3fKqE6kVh5JbIQ8I'; // Using a public test key. Replace with your own for production.

const THEMES = {
    whatsapp_dark: {
        id: 'whatsapp_dark',
        name: 'iOS Dark',
        bg: 'bg-black',
        bgOp: 'bg-[url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")] bg-fixed opacity-20',
        header: 'bg-[#121212] border-b border-[#262626]',
        headerText: 'text-white',
        incoming: 'bg-[#1f2c34] text-white rounded-2xl rounded-bl-sm',
        outgoing: 'bg-[#005d4b] text-white rounded-2xl rounded-br-sm',
        input: 'bg-[#1c1c1e] text-white rounded-full border border-[#333]',
        placeholder: 'placeholder-zinc-500',
        icon: 'text-[#007AFF]',
        dateDetails: 'text-zinc-400',
        button: 'bg-[#007AFF] hover:bg-[#006ee6]',
        inputContainer: 'bg-black border-t border-[#1c1c1e]'
    },
    whatsapp_light: {
        id: 'whatsapp_light',
        name: 'iOS Light',
        bg: 'bg-[#efeae2]',
        bgOp: 'bg-[url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")] bg-fixed opacity-40',
        header: 'bg-[#f5f5f5] border-b border-[#dadada]',
        headerText: 'text-black',
        incoming: 'bg-white text-black shadow-sm rounded-2xl rounded-bl-sm',
        outgoing: 'bg-[#d9fdd3] text-black shadow-sm rounded-2xl rounded-br-sm',
        input: 'bg-white text-black rounded-full border border-[#dadada]',
        placeholder: 'placeholder-zinc-400',
        icon: 'text-[#007AFF]',
        dateDetails: 'text-zinc-500',
        button: 'bg-[#007AFF] hover:bg-[#006ee6]',
        inputContainer: 'bg-[#f5f5f5] border-t border-[#dadada]'
    }
};

interface Message {
    id: string;
    text: string;
    image_url?: string;
    audio_url?: string;
    isUser: boolean;
    created_at: string;
    sender_id?: string;
    is_deleted?: boolean;
}

interface ChatViewProps {
    messages: Message[];
    senderId: string;
    onLogout: () => void;
    onMessageSent?: (msg: Message) => void;
}

export const ChatView = ({ messages, senderId, onLogout, onMessageSent }: ChatViewProps) => {
    // Theme State
    const [theme, setTheme] = useState<keyof typeof THEMES>('whatsapp_dark');
    const colors = THEMES[theme];

    const [newMessage, setNewMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [showGif, setShowGif] = useState(false); // Add GIF state
    const [gifs, setGifs] = useState<any[]>([]);
    const [gifSearch, setGifSearch] = useState('');
    const [loadingGifs, setLoadingGifs] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false); // Add this
    const [clearingChat, setClearingChat] = useState(false); // Add this
    const [showAttachments, setShowAttachments] = useState(false); // Restore accidentally removed state
    
    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    
    // Delete State
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Attachments State
    const [previewImage, setPreviewImage] = useState<{ file: File, url: string } | null>(null);
    
    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

    // Fullscreen Image View State
    const [viewImage, setViewImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null); // Add this ref
    const bottomRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewImage) URL.revokeObjectURL(previewImage.url);
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Auto-scroll logic to stay at bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, previewImage, audioPreviewUrl, isRecording]);

    // Fetch GIFs
    useEffect(() => {
        if (!showGif) return;
        
        const fetchGifs = async () => {
            setLoadingGifs(true);
            try {
                const endpoint = gifSearch.trim() 
                    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${gifSearch}&limit=20`
                    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;
                
                const res = await fetch(endpoint);
                const data = await res.json();
                setGifs(data.data || []);
            } catch (err) {
                console.error("Failed to fetch GIFs", err);
            } finally {
                setLoadingGifs(false);
            }
        };

        const timeout = setTimeout(fetchGifs, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [showGif, gifSearch]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const handleDeleteOption = async (option: 'everyone' | 'me') => {
        if (!deletingId) return;
        const id = deletingId;
        setDeletingId(null);
        
        try {
            if (option === 'everyone') {
                await deleteMessageForEveryone(id);
            } else {
                await deleteMessageForMe(id);
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Delete failed");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { 
                alert("File too large. Max 5MB.");
                return;
            }
            if (previewImage) URL.revokeObjectURL(previewImage.url);
            setPreviewImage({ file, url: URL.createObjectURL(file) });
            setShowEmoji(false);
        }
    };

    const handleEditStart = (msg: Message) => {
        setEditingId(msg.id);
        setEditText(msg.text);
    };

    const handleEditSave = async (id: string) => {
        if (!editText.trim()) return;
        setEditingId(null);
        try {
            await updateMessage(id, editText);
        } catch (error) {
            console.error("Edit failed", error);
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditText('');
    };

    // Audio Recording Functions
    const startRecording = async () => {
        setAudioBlob(null);
        if (audioPreviewUrl) {
            URL.revokeObjectURL(audioPreviewUrl);
            setAudioPreviewUrl(null);
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioPreviewUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

        } catch (err) {
            console.error("Microphone Error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (isRecording) stopRecording();
        setAudioBlob(null);
        if (audioPreviewUrl) {
            URL.revokeObjectURL(audioPreviewUrl);
            setAudioPreviewUrl(null);
        }
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const hasText = !!newMessage.trim();
        const hasImage = !!previewImage;
        const hasAudio = !!audioBlob;

        if ((!hasText && !hasImage && !hasAudio) || uploading) return;

        const textToSend = newMessage;
        const imageToUpload = previewImage;
        const audioToUpload = audioBlob;

        setNewMessage('');
        setPreviewImage(null);
        setAudioBlob(null);
        setAudioPreviewUrl(null);
        setShowEmoji(false);
        setUploading(true);

        try {
            let imageUrl = undefined;
            let audioUrl = undefined;

            if (imageToUpload) {
                const fileExt = imageToUpload.file.name.split('.').pop();
                const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${senderId}/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, imageToUpload.file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
                imageUrl = data.publicUrl;
            }

            if (audioToUpload) {
                const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
                const filePath = `${senderId}/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, audioToUpload);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
                audioUrl = data.publicUrl;
            }

            const response = await sendMessage(textToSend, imageUrl, audioUrl);
            
            if (response.success && response.data && onMessageSent) {
                onMessageSent({
                    id: response.data.id,
                    text: response.data.text,
                    image_url: response.data.image_url,
                    audio_url: response.data.audio_url,
                    isUser: true,
                    created_at: response.data.created_at,
                    sender_id: response.data.sender_id,
                    is_deleted: response.data.is_deleted
                });
            }

        } catch (error: any) {
            console.error("Send Error:", error);
            setNewMessage(textToSend);
            alert(`Failed to send: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const toggleTheme = () => {
        const themes: (keyof typeof THEMES)[] = ['whatsapp_dark', 'whatsapp_light'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const handleClearChat = async (option: 'everyone' | 'me') => {
        setClearingChat(false);
        try {
            await clearChat(option);
            // If clearing for me, we might optionally empty the local state immediately
            // But Realtime updates might be slow to propagate "deleted_for" to *me* if I just sent it.
            // So let's refresh page or manually filter.
            // Actually, for "Clear Chat", reloading the window is often safest/easiest to ensure complex state is clean.
            window.location.reload(); 
        } catch (error) {
            console.error("Clear chat failed", error);
            alert("Failed to clear chat");
        }
    };

    const handleGifSelect = async (gifUrl: string) => {
        setShowGif(false);
        setUploading(true);
        try {
            await sendMessage('', gifUrl, undefined);
        } catch (error) {
            console.error("Failed to send GIF", error);
        } finally {
            setUploading(false);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = '24px'; // Reset to min height
            const scrollHeight = textAreaRef.current.scrollHeight;
            // Expand up to 200px (approx 8 lines) before scrolling
            textAreaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`; 
        }
    }, [newMessage]);

    return (
        <div className={`flex flex-col h-[100dvh] relative overflow-hidden transition-colors duration-300 ${colors.bg}`}>
            {/* Background Pattern */}
             <div className={`absolute inset-0 z-0 pointer-events-none opacity-10 ${colors.bgOp}`} style={{ backgroundSize: '400px' }} />

            {/* Header */}
            <header className={`shrink-0 h-[44px] ${colors.header} flex items-center justify-between px-2 z-20 shadow-sm transition-colors duration-300`}>
                 <div className="flex items-center gap-2 flex-1 overflow-hidden">
                     <button className={`${colors.icon} -ml-1 flex items-center`}>
                        <ChevronLeft size={26} />
                     </button>
                     <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                             <img 
                                src="/logo.png" 
                                alt="Apna Chat" 
                                className="w-full h-full object-cover"
                             />
                        </div>
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className={`font-semibold text-[16px] leading-tight truncate block ${colors.headerText}`}>
                            Apna Chat
                        </span>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-5 px-3">
                     <button className={`${colors.icon}`}>
                         <Video size={20} />
                     </button>
                     <button className={`${colors.icon}`}>
                         <Phone size={20} />
                     </button>
                     <button 
                        onClick={toggleTheme}
                        className={`${colors.icon}`}
                        title="Change Theme"
                    >
                         <Palette size={22} />
                     </button>
                     
                     <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className={`${colors.icon}`}
                        >
                            <MoreVertical size={22} />
                        </button>
                        
                        <AnimatePresence>
                        {showMenu && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${theme === 'whatsapp_light' ? 'bg-white border-gray-100' : 'bg-[#2a3942] border-[#2a3942]'}`}
                            >
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        setClearingChat(true);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-red-500`}
                                >
                                    Clear Chat
                                </button>
                                <button 
                                    onClick={() => {
                                        onLogout();
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${theme === 'whatsapp_light' ? 'text-black' : 'text-white'}`}
                                >
                                    Log out
                                </button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                     </div>
                 </div>
            </header>
            
            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto w-full p-3 sm:p-5 space-y-2 relative z-10 scroll-smooth" onClick={() => setShowEmoji(false)}>
                 <AnimatePresence initial={false}>
                 {messages.map((msg) => (
                    <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} group mb-1`}
                    >
                        <div 
                            className={`
                                max-w-[85%] sm:max-w-[70%] md:max-w-[60%] w-fit shadow-sm relative text-[16px] leading-relaxed
                                ${msg.isUser ? colors.outgoing : colors.incoming}
                                ${msg.image_url ? 'p-1' : 'px-2 py-1.5'}
                            `}
                        >
                            {editingId === msg.id ? (
                                <div className="min-w-[120px] p-0.5">
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className={`w-full bg-transparent p-1 text-[16px] leading-[22px] resize-none focus:outline-none border-b border-white/20 ${colors.headerText}`}
                                        rows={Math.max(1, Math.ceil(editText.length / 30))}
                                        autoFocus
                                        style={{ height: 'auto', minHeight: '28px' }}
                                    />
                                    <div className="flex justify-end gap-3 mt-1.5">
                                        <button onClick={handleEditCancel} className="p-1 hover:text-red-400 transition-colors">
                                            <X size={16} />
                                        </button>
                                        <button onClick={() => handleEditSave(msg.id)} className="p-1 hover:text-green-400 transition-colors">
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {msg.image_url && (
                                        <div className="rounded-lg overflow-hidden relative mb-1">
                                            <img 
                                                src={msg.image_url} 
                                                alt="attachment" 
                                                className="w-full h-auto max-h-[300px] object-cover block cursor-pointer active:scale-95 transition-transform" 
                                                loading="lazy"
                                                onClick={() => msg.image_url && setViewImage(msg.image_url)}
                                            />
                                        </div>
                                    )}

                                    {msg.audio_url && (
                                        <div className="flex items-center gap-2 w-full min-w-[240px] px-1 py-1">
                                            <audio controls src={msg.audio_url} className="w-full h-9 rounded opacity-90" />
                                        </div>
                                    )}

                                    {msg.text && msg.text !== 'Image' && msg.text !== 'Audio Message' && (
                                        <div className={`relative inline-block text-left ${msg.image_url || msg.audio_url ? 'w-full px-1 pb-1' : ''}`}>
                                            <span className={`break-words whitespace-pre-wrap font-poppins text-[16px] leading-[22px] ${msg.is_deleted ? 'italic opacity-60' : ''}`}>
                                                {msg.text}
                                                <span className="inline-block w-8 h-0"></span>
                                            </span>
                                            
                                            <span className={`float-right -mt-1.5 ml-1 flex items-center gap-0.5 select-none ${msg.image_url ? 'hidden' : ''} translate-y-1`}>
                                                {msg.isUser && !msg.image_url && !msg.audio_url && !msg.is_deleted && (
                                                    <button 
                                                        onClick={() => handleEditStart(msg)}
                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 mr-0.5`}
                                                        title="Edit Message"
                                                    >
                                                        <Pencil size={10} />
                                                    </button>
                                                )}
                                                {msg.isUser && !msg.is_deleted && (
                                                    <button 
                                                        onClick={() => setDeletingId(msg.id)}
                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 mr-0.5`}
                                                        title="Delete Message"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                                <span className={`text-[11px] font-normal ${colors.dateDetails}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true }).toLowerCase()}
                                                </span>
                                                {msg.isUser && (
                                                    <Check size={14} className={`ml-0.5 text-[#53bdeb]`} />
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Image has its own absolute timestamp */}
                                    {msg.image_url && (
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1 drop-shadow-md bg-black/20 px-1 rounded-sm backdrop-blur-[1px]">
                                            <span className="text-[10px] text-white font-medium">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true }).toLowerCase()}
                                            </span>
                                            {msg.isUser && <Check size={12} className="text-white" />}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
                
                {uploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end px-4">
                        <div className={`
                            ${theme === 'whatsapp_light' ? 'bg-white text-gray-500 shadow-md' : 'bg-[#202c33] text-gray-300'} 
                            rounded-full px-4 py-2 flex items-center gap-2 text-xs opacity-90
                        `}>
                            <Loader2 size={12} className="animate-spin text-green-500" /> 
                            <span>Sending...</span>
                        </div>
                    </motion.div>
                )}
                
                <div ref={bottomRef} className="h-2" />
            </main>
            
            {/* Previews & Controls Area */}
            <div className={`shrink-0 ${colors.inputContainer} relative z-20 pb-[env(safe-area-inset-bottom)] transition-colors duration-300`}>
                
                {/* File Preview */}
                <AnimatePresence>
                {previewImage && (
                    <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="overflow-hidden">
                        <div className={`px-4 py-2 flex items-center gap-3 mx-4 mt-2 rounded-xl border border-white/5 shadow-lg ${theme === 'whatsapp_light' ? 'bg-white' : 'bg-[#2a3942]'}`}>
                            <div className="relative group shrink-0">
                                <img src={previewImage.url} alt="Preview" className="h-14 w-14 object-cover rounded-lg" />
                                <button onClick={() => setPreviewImage(null)} className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-0.5 shadow-md">
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${colors.headerText}`}>{previewImage.file.name}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Audio Preview */}
                {audioPreviewUrl && !isRecording && (
                     <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="overflow-hidden">
                        <div className={`px-4 py-2 flex items-center gap-2 mx-4 mt-2 rounded-xl shadow-lg border border-white/5 ${theme === 'whatsapp_light' ? 'bg-white' : 'bg-[#2a3942]'}`}>
                            <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-red-500/10 rounded-full text-red-500">
                                <Mic size={16} />
                            </div>
                            <audio controls src={audioPreviewUrl} className="flex-1 h-8 max-w-full" />
                            <button onClick={cancelRecording} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* GIF Picker Modal */}
                <AnimatePresence>
                {showGif && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`absolute bottom-full left-0 sm:left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden w-[320px] h-[400px] flex flex-col ${theme === 'whatsapp_light' ? 'bg-white' : 'bg-[#1f2c34]'}`}
                    >
                        {/* Search Bar */}
                        <div className="p-3 border-b border-white/10 flex gap-2">
                             <div className={`flex-1 flex items-center px-3 py-2 rounded-lg ${theme === 'whatsapp_light' ? 'bg-gray-100' : 'bg-[#2a3942]'}`}>
                                <Search size={16} className="opacity-50 mr-2" />
                                <input 
                                    type="text" 
                                    placeholder="Search GIFs..." 
                                    className="bg-transparent text-sm w-full outline-none"
                                    value={gifSearch}
                                    onChange={(e) => setGifSearch(e.target.value)}
                                    autoFocus
                                />
                             </div>
                             <button onClick={() => setShowGif(false)} className="p-2 hover:bg-black/10 rounded-full">
                                <X size={20} className="opacity-60" />
                             </button>
                        </div>
                        
                        {/* GIF Grid */}
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                            {loadingGifs ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="animate-spin opacity-50" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {gifs.map((gif) => (
                                        <button 
                                            key={gif.id} 
                                            onClick={() => handleGifSelect(gif.images.fixed_height.url)}
                                            className="rounded-lg overflow-hidden relative aspect-video bg-black/10 hover:opacity-90 transition-opacity"
                                        >
                                            <img 
                                                src={gif.images.preview_gif.url} 
                                                alt={gif.title} 
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!loadingGifs && gifs.length === 0 && (
                                <div className="text-center p-4 opacity-50 text-sm">No GIFs found</div>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Emoji Picker Modal */}
                <AnimatePresence>
                {showEmoji && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-full left-0 sm:left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
                    >
                        <EmojiPicker 
                            theme={theme === 'whatsapp_light' ? Theme.LIGHT : Theme.DARK}
                            onEmojiClick={handleEmojiClick}
                            width={320}
                            height={400}
                            lazyLoadEmojis={true}
                            previewConfig={{ showPreview: false }}
                        />
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Attachment Menu Popup */}
                <AnimatePresence>
                    {showAttachments && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className={`absolute bottom-[70px] left-4 p-3 rounded-2xl shadow-xl z-50 flex items-center gap-4 ${theme === 'whatsapp_light' ? 'bg-white' : 'bg-[#1f2c34]'}`}
                        >
                            <button 
                                onClick={() => {
                                    setShowAttachments(false);
                                    startRecording();
                                }}
                                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white"
                            >
                                <Mic />
                            </button>
                             <button
                                onClick={() => {
                                    fileInputRef.current?.click();
                                    setShowAttachments(false);
                                }}
                                className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white"
                            >
                                <ImageIcon />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {deletingId && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px]" onClick={() => setDeletingId(null)}>
                            <motion.div 
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-full sm:w-[320px] sm:rounded-2xl rounded-t-2xl p-4 shadow-2xl flex flex-col gap-2 ${theme === 'whatsapp_light' ? 'bg-white text-black' : 'bg-[#1f2c34] text-white'}`}
                            >
                                <div className="text-center mb-2 pt-2">
                                     <p className={`text-sm font-medium ${theme === 'whatsapp_light' ? 'text-gray-500' : 'text-gray-400'}`}>Delete message?</p>
                                </div>
                                
                                <button 
                                    onClick={() => handleDeleteOption('everyone')}
                                    className={`w-full py-3.5 px-4 rounded-xl font-medium text-red-500 flex items-center justify-center gap-2 active:scale-98 transition-transform ${
                                         theme === 'whatsapp_light' ? 'bg-red-50 active:bg-red-100' : 'bg-red-500/10 active:bg-red-500/20'
                                    }`}
                                >
                                    <Trash2 size={18} /> Delete for everyone
                                </button>

                                <button 
                                    onClick={() => handleDeleteOption('me')}
                                    className={`w-full py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform ${
                                         theme === 'whatsapp_light' ? 'bg-gray-100 text-gray-900 active:bg-gray-200' : 'bg-[#2a3942] text-white active:bg-[#374248]'
                                    }`}
                                >
                                    <Trash2 size={18} className="opacity-70" /> Delete for me
                                </button>

                                <button 
                                    onClick={() => setDeletingId(null)}
                                    className={`w-full py-3.5 rounded-xl font-semibold mt-1 active:scale-98 transition-transform ${
                                        theme === 'whatsapp_light' ? 'bg-white text-blue-500 border border-gray-100 shadow-sm' : 'bg-transparent text-blue-400 border border-white/5'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <div className="h-4 sm:h-0"></div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Clear Chat Confirmation Modal */}
                <AnimatePresence>
                    {clearingChat && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px]" onClick={() => setClearingChat(false)}>
                            <motion.div 
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-full sm:w-[320px] sm:rounded-2xl rounded-t-2xl p-4 shadow-2xl flex flex-col gap-2 ${theme === 'whatsapp_light' ? 'bg-white text-black' : 'bg-[#1f2c34] text-white'}`}
                            >
                                <div className="text-center mb-2 pt-2">
                                     <h3 className="font-bold text-lg mb-1">Clear Chat?</h3>
                                     <p className={`text-sm font-medium ${theme === 'whatsapp_light' ? 'text-gray-500' : 'text-gray-400'}`}>This action cannot be undone.</p>
                                </div>
                                
                                <button 
                                    onClick={() => handleClearChat('everyone')}
                                    className={`w-full py-3.5 px-4 rounded-xl font-medium text-red-500 flex items-center justify-center gap-2 active:scale-98 transition-transform ${
                                         theme === 'whatsapp_light' ? 'bg-red-50 active:bg-red-100' : 'bg-red-500/10 active:bg-red-500/20'
                                    }`}
                                >
                                    <Trash2 size={18} /> Clear for everyone
                                </button>

                                <button 
                                    onClick={() => handleClearChat('me')}
                                    className={`w-full py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform ${
                                         theme === 'whatsapp_light' ? 'bg-gray-100 text-gray-900 active:bg-gray-200' : 'bg-[#2a3942] text-white active:bg-[#374248]'
                                    }`}
                                >
                                    <Trash2 size={18} className="opacity-70" /> Clear for me
                                </button>

                                <button 
                                    onClick={() => setClearingChat(false)}
                                    className={`w-full py-3.5 rounded-xl font-semibold mt-1 active:scale-98 transition-transform ${
                                        theme === 'whatsapp_light' ? 'bg-white text-blue-500 border border-gray-100 shadow-sm' : 'bg-transparent text-blue-400 border border-white/5'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <div className="h-4 sm:h-0"></div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Main Input Bar */}
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3 p-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => setShowAttachments(!showAttachments)} 
                        className={`${colors.icon} p-2 transition-transform ${showAttachments ? 'rotate-45' : ''}`}
                    >
                        <Plus size={26} strokeWidth={2.5} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                    <div className="flex-1">
                         {isRecording ? (
                            <div className={`h-[42px] flex items-center px-4 rounded-full gap-3 ${theme === 'whatsapp_light' ? 'bg-white' : 'bg-[#1c1c1e]'}`}>
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-500 font-mono text-sm">{formatTime(recordingTime)}</span>
                                <div className="flex-1" />
                                <button type="button" onClick={cancelRecording} className="text-xs text-gray-400 hover:text-red-400 mr-4 tracking-wide font-medium">CANCEL</button>
                                <button type="button" onClick={stopRecording} className="text-[#53bdeb] font-semibold text-sm">
                                    STOP
                                </button>
                            </div>
                        ) : (
                            <div className={`flex items-center rounded-3xl px-2 py-2 ${colors.input} border-[0.5px] border-black/10 dark:border-white/10`}>
                                <div className="flex items-center gap-1 mr-2">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!showEmoji) {
                                                textAreaRef.current?.blur();
                                            }
                                            setShowEmoji(!showEmoji);
                                            setShowGif(false);
                                        }} 
                                        className={'p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400'}
                                    >
                                        <Smile size={20} className={showEmoji ? 'text-emerald-500' : ''} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!showGif) {
                                                textAreaRef.current?.blur();
                                            }
                                            setShowGif(!showGif);
                                            setShowEmoji(false);
                                        }} 
                                        className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${showGif ? 'text-pink-500' : 'text-gray-400'}`}
                                    >
                                        <Gift size={20} />
                                    </button>
                                </div>

                                <textarea
                                    ref={textAreaRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onFocus={() => {
                                        setShowEmoji(false);
                                        setShowGif(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                                    }}
                                    placeholder="Message.."
                                    rows={1}
                                    className={`w-full bg-transparent p-0 focus:outline-none text-[16px] resize-none max-h-[200px] leading-relaxed ${colors.placeholder} placeholder:font-normal`}
                                    style={{ height: '24px', minHeight: '24px' }}
                                />
                            </div>
                        )}
                    </div>

                    {isRecording ? (
                        <div className="w-[50px]"></div> /* Placeholder to keep layout stable */
                    ) : (
                        <button 
                            type="submit" 
                            disabled={uploading || (!newMessage.trim() && !audioPreviewUrl && !previewImage)} 
                            className={`font-bold text-[13px] tracking-wide px-3 py-2 shrink-0 ${theme === 'whatsapp_light' ? 'text-[#007AFF]' : 'text-[#53bdeb]'}`}
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : "SEND"}
                        </button>
                    )}
                </form>
            </div>

            {/* Fullscreen Image Viewer */}
            <AnimatePresence>
            {viewImage && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
                    onClick={() => setViewImage(null)}
                >
                    <motion.img 
                        src={viewImage} 
                        alt="Fullscreen View" 
                        className="max-w-full max-h-full object-contain"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                    />
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};
