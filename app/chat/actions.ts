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
            // No maxAge implies session cookie (deleted when browser closes)
        });
        return { success: true, userId: data.passcode, label: data.label, roomId: data.room_id };
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

    const { data, error } = await supabase
        .from('secret_chat_messages')
        .insert({
            text: text ? text.trim() : (imageUrl ? 'Image' : (audioUrl ? 'Audio Message' : '')),
            image_url: imageUrl || null,
            audio_url: audioUrl || null,
            sender_id: userId,
            room_id: userData.room_id
        })
        .select()
        .single();

    if (error) {
        console.error('Server Action Error:', error);
        throw new Error(error.message);
    }
    
    return { success: true, data };
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

    // Filter out messages deleted for this user
    const visibleMessages = data.filter(msg => {
        const deletedFor = msg.deleted_for || [];
        return !deletedFor.includes(userId);
    });

    return visibleMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        image_url: msg.image_url,
        audio_url: msg.audio_url,
        isUser: msg.sender_id === userId,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        is_deleted: msg.is_deleted // Pass this flag
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

export async function deleteMessageForEveryone(messageId: string) {
    const userId = await getSession();
    if (!userId) throw new Error('Unauthorized');

    // Soft delete: Update is_deleted flag instead of removing row
    const { error } = await supabase
        .from('secret_chat_messages')
        .update({ 
            is_deleted: true,
            text: '🚫 This message was deleted',
            image_url: null, 
            audio_url: null 
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

    if (error) {
        console.error('Delete Error:', error);
        throw new Error(error.message);
    }
    
    return { success: true };
}

export async function deleteMessageForMe(messageId: string) {
    const userId = await getSession();
    if (!userId) throw new Error('Unauthorized');

    // Fetch current deleted_for array
    const { data: msg, error: fetchError } = await supabase
        .from('secret_chat_messages')
        .select('deleted_for')
        .eq('id', messageId)
        .single();
    
    if (fetchError) throw new Error(fetchError.message);

    const currentDeletedFor = msg.deleted_for || [];
    if (currentDeletedFor.includes(userId)) return { success: true };

    const { error } = await supabase
        .from('secret_chat_messages')
        .update({ deleted_for: [...currentDeletedFor, userId] })
        .eq('id', messageId);

    if (error) {
        console.error('Delete For Me Error:', error);
        throw new Error(error.message);
    }
    
    return { success: true };
}

export async function clearChat(scope: 'me' | 'everyone') {
    const userId = await getSession();
    if (!userId) throw new Error('Unauthorized');
    
    // Get Room ID
    const { data: userData } = await supabase
        .from('authorized_users')
        .select('room_id')
        .eq('passcode', userId)
        .single();
    
    if (!userData?.room_id) throw new Error('No room found');
    const roomId = userData.room_id;

    if (scope === 'everyone') {
        // Soft delete all active messages in the room
        const { error } = await supabase
            .from('secret_chat_messages')
            .update({ 
                is_deleted: true,
                text: '🚫 This message was deleted',
                image_url: null, 
                audio_url: null 
            })
            .eq('room_id', roomId)
            .eq('is_deleted', false);

        if (error) throw new Error(error.message);
    } else {
        // Clear for me: Add userId to deleted_for array for all visible messages
        // 1. Fetch messages that don't have me in deleted_for
        const { data: messages, error: fetchError } = await supabase
            .from('secret_chat_messages')
            .select('id, deleted_for')
            .eq('room_id', roomId);
            
        if (fetchError) throw new Error(fetchError.message);

        // 2. Filter locally to find ones where I am NOT in deleted_for
        const messagesToUpdate = messages.filter(msg => {
            const deletedFor = msg.deleted_for || [];
            return !deletedFor.includes(userId);
        });

        // 3. Update them (in parallel for now, assuming volume isn't massive)
        // Ideally this would be a Postgres function or a single query if Postgres supported complex array updates easily via PostgREST
        const updates = messagesToUpdate.map(msg => {
            const currentDeletedFor = msg.deleted_for || [];
            return supabase
                .from('secret_chat_messages')
                .update({ deleted_for: [...currentDeletedFor, userId] })
                .eq('id', msg.id);
        });

        await Promise.all(updates);
    }
    
    return { success: true };
}
