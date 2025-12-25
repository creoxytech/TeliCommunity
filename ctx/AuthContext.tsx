import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    hasProfile: boolean | null;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    hasProfile: null,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);

    const checkProfile = async (userId: string | undefined) => {
        if (!userId) {
            setHasProfile(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // No rows returned
                setHasProfile(false);
            } else if (data) {
                setHasProfile(true);
            } else {
                setHasProfile(false);
            }
        } catch (e) {
            console.error('Error checking profile:', e);
            setHasProfile(false);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkProfile(session?.user.id).then(() => setIsLoading(false));
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('Auth State Change Event:', _event, 'Session:', session ? 'Exists' : 'Null');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkProfile(session.user.id);
            } else {
                setHasProfile(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isLoading) {
        // You might want to replace this with a SplashScreen logic later
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const refreshProfile = async () => {
        if (session?.user?.id) {
            await checkProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, isLoading, hasProfile, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
