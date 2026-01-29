'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/app/lib/supabaseClient';

// Helper to get the current session
async function getSession() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('chat_user');
    return userCookie?.value;
}

export async function authenticate(password: string) {
    // Check against Supabase Database instead of hardcoded values
    const { data, error } = await supabase
        .from('authorized_users')
        .select('*')
        .eq('passcode', password)
        .single();

    if (data && !error) {
        const cookieStore = await cookies();
        cookieStore.set('chat_user', password, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 // 24 hours
        });
        return { success: true, userId: data.passcode, label: data.label };
    }
    
    return { success: false, message: 'Invalid Passkey' };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('chat_user');
    return { success: true };
}

export async function sendMessage(text: string, imageUrl?: string, audioUrl?: string) {
    const userId = await getSession();
    
    if (!userId) {
        throw new Error('Unauthorized');
    }

    if ((!text || !text.trim()) && !imageUrl && !audioUrl) {
        throw new Error('Message cannot be empty');
    }

    // Get Room ID for the user
    const { data: userData } = await supabase
        .from('authorized_users')
        .select('room_id')
        .eq('passcode', userId)
        .single();
    
    if (!userData?.room_id) {
        throw new Error('User not assigned to a room');
    }

    const { error } = await supabase
        .from('secret_chat_messages')
        .insert({
            text: text ? text.trim() : (imageUrl ? 'Image' : (audioUrl ? 'Audio Message' : '')),
            image_url: imageUrl || null,
            audio_url: audioUrl || null,
            sender_id: userId,
            room_id: userData.room_id
        });

    if (error) {
        console.error('Server Action Error:', error);
        throw new Error(error.message);
    }
    
    return { success: true };
}

export async function updateMessage(messageId: string, newText: string) {
    const userId = await getSession();
    if (!userId) throw new Error('Unauthorized');

    if (!newText || !newText.trim()) {
        throw new Error('Message cannot be empty');
    }

    const { error } = await supabase
        .from('secret_chat_messages')
        .update({ text: newText.trim() })
        .eq('id', messageId)
        .eq('sender_id', userId);

    if (error) {
        console.error('Update Error:', error);
        throw new Error(error.message);
    }
    
    return { success: true };
}

export async function getInitialMessages() {
    const userId = await getSession();
    if (!userId) return [];

    // Get Room ID for the user
    const { data: userData } = await supabase
        .from('authorized_users')
        .select('room_id')
        .eq('passcode', userId)
        .single();
    
    if (!userData?.room_id) {
        return [];
    }

    const { data, error } = await supabase
        .from('secret_chat_messages')
        .select('*')
        .eq('room_id', userData.room_id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Fetch Error:', error);
        return [];
    }

    return data.map(msg => ({
        id: msg.id,
        text: msg.text,
        image_url: msg.image_url,
        audio_url: msg.audio_url,
        isUser: msg.sender_id === userId,
        created_at: msg.created_at,
        sender_id: msg.sender_id
    }));
}

export async function checkSession() {
    const userId = await getSession();
    if (userId) {
        // Fetch room properties along with session
        const { data } = await supabase
            .from('authorized_users')
            .select('room_id')
            .eq('passcode', userId)
            .single();
            
        return { isAuthenticated: true, userId, roomId: data?.room_id };
    }
    return { isAuthenticated: false };
}
