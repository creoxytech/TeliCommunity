import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useToast } from '../../ctx/ToastContext';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { supabase } from '../../lib/supabase';

// Helper to complete auth session
WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

export default function SignIn() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const theme = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';

    const performGoogleSignIn = async () => {
        setLoading(true);
        try {
            // 1. Initiate OAuth
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: 'telicommunity://google-auth',
                },
            });

            if (error) throw error;

            if (data.url) {
                // 2. Open Browser
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    'telicommunity://'
                );

                // 3. Handle Result
                if (result.type === 'success' && result.url) {
                    const hash = result.url.split('#')[1];
                    if (!hash) return;

                    const params = new URLSearchParams(hash);
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });

                        if (sessionError) throw sessionError;

                        showToast('Sign in successful!', 'success');
                        setTimeout(() => {
                            router.replace('/(tabs)');
                        }, 500);
                    }
                }
            }
        } catch (e: any) {
            showToast('Sign in failed: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.circle, { backgroundColor: theme.primary, opacity: 0.08 }]} />

            <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="chatbubbles" size={42} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>TeliCommunity</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Connect, share, and grow with your community.
                    </Text>
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.googleButton,
                            { backgroundColor: theme.surface, borderColor: theme.border }
                        ]}
                        onPress={performGoogleSignIn}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={24} color={isDark ? '#FFF' : '#3B82F6'} />
                                <Text style={[styles.googleButtonText, { color: theme.text }]}>
                                    Continue with Google
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.terms, { color: theme.textSecondary }]}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 86,
        height: 86,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 280,
    },
    actions: {
        gap: 20,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        borderRadius: 18,
        gap: 12,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    googleButtonText: {
        fontSize: 17,
        fontWeight: '700',
    },
    terms: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.6,
        paddingHorizontal: 20,
    },
});
