'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const SecretChat = () => {
    const router = useRouter();
    const [clickCount, setClickCount] = useState(0);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleClick = () => {
        setClickCount(prev => {
            const next = prev + 1;
            if (next >= 3) {
                router.push('/chat');
                return 0;
            }
            return next;
        });
        
        // Reset count if not clicked continuously
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = setTimeout(() => {
            setClickCount(0);
        }, 2000); // Must click 3 times within 2 second windows
    };

    return (
        /* Secret Invisible Trigger Area - Bottom Right fixed */
        <div 
            onClick={handleClick}
            className="fixed bottom-0 right-0 w-32 h-32 z-[9999] cursor-default"
            title="" // No tooltip
            style={{ 
                opacity: 0, 
                touchAction: 'manipulation' // Improves touch response
            }} 
        />
    );
};

