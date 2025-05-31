import { sendGAEvent } from "@next/third-parties/google";
import { useEffect, useState } from "react";

// Extend Window interface for gtag
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

export function useGATracking() {
    const [isGALoaded, setIsGALoaded] = useState(false);

    useEffect(() => {
        // Check if GA is loaded
        const checkGA = () => {
            if (typeof window !== 'undefined' && window.gtag) {
                setIsGALoaded(true);
            } else {
                // Retry after a short delay
                setTimeout(checkGA, 100);
            }
        };

        checkGA();
    }, []);

    const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
        if (!isGALoaded || !process.env.NEXT_PUBLIC_GA_ID) {
            console.warn('GA not loaded or GA ID not configured');
            return;
        }

        try {
            sendGAEvent('event', eventName, {
                event_category: 'user_action',
                ...parameters
            });
        } catch (error) {
            console.warn('Failed to send GA event:', error);
        }
    };

    const trackWalletSearch = (address: string) => {
        trackEvent('wallet_search', {
            event_category: 'engagement',
            event_label: 'address_lookup',
            address_suffix: address.slice(-6)
        });
    };

    return {
        isGALoaded,
        trackEvent,
        trackWalletSearch
    };
} 