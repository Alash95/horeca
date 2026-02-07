import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface IdleTimeoutProps {
    timeoutMs?: number; // Default 5 minutes (300,000 ms)
}

export const IdleTimeout = ({ timeoutMs = 300000 }: IdleTimeoutProps) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const logout = async () => {
        console.log('🕒 Idle timeout reached. Logging out...');
        await supabase.auth.signOut();
        window.location.href = '/'; // Force redirect to landing
    };

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(logout, timeoutMs);
    };

    useEffect(() => {
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click'
        ];

        resetTimer();

        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeoutMs]);

    return null;
};
