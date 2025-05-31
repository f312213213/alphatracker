import { useState, useEffect, useCallback } from 'react';

const RECENT_SEARCHES_KEY = 'alpha-tracker-recent-searches';
const MAX_RECENT_SEARCHES = 5;

const validateAddress = (address: string): boolean => {
    if (!address.startsWith('0x') || address.length !== 42) return false;
    const hexRegex = /^[0-9a-fA-F]+$/;
    return hexRegex.test(address.slice(2));
};

export function useRecentSearches() {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load recent searches from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    // Filter out invalid addresses
                    const validAddresses = parsed.filter(validateAddress);
                    setRecentSearches(validAddresses.slice(0, MAX_RECENT_SEARCHES));
                }
            }
        } catch (error) {
            console.error('Error loading recent searches:', error);
        }
    }, []);

    // Add a new search to recent searches
    const addRecentSearch = useCallback((address: string) => {
        if (!validateAddress(address)) return;

        setRecentSearches(prev => {
            // Remove the address if it already exists to avoid duplicates
            const filtered = prev.filter(addr => addr.toLowerCase() !== address.toLowerCase());
            // Add the new address at the beginning
            const updated = [address, ...filtered].slice(0, MAX_RECENT_SEARCHES);

            // Save to localStorage
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving recent searches:', error);
            }

            return updated;
        });
    }, []);

    // Clear all recent searches
    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (error) {
            console.error('Error clearing recent searches:', error);
        }
    }, []);

    // Remove a specific recent search
    const removeRecentSearch = useCallback((address: string) => {
        setRecentSearches(prev => {
            const updated = prev.filter(addr => addr.toLowerCase() !== address.toLowerCase());

            // Save to localStorage
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving recent searches:', error);
            }

            return updated;
        });
    }, []);

    return {
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        removeRecentSearch,
    };
} 