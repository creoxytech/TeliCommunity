import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;

        const { count } = await supabase
            .from('admins')
            .select('*', { count: 'exact', head: true })
            .eq('email', session.user.email);

        setIsAdmin(!!count && count > 0);
    };

    const fetchProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const performLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={[styles.avatar, { borderColor: theme.primary }]} />
                        ) : (
                            <View style={[styles.placeholderAvatar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.avatarText, { color: theme.primary }]}>
                                    {profile?.full_name?.[0] || '?'}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: theme.primary }]}>
                            <Ionicons name="pencil" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.username, { color: theme.text }]}>
                        {profile?.full_name || 'User'}
                    </Text>
                    <Text style={[styles.handle, { color: theme.textSecondary }]}>
                        {profile?.username ? `@${profile.username}` : ''}
                    </Text>
                </View>

                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Personal Details</Text>

                    <View style={styles.row}>
                        <Ionicons name="location-outline" size={20} color={theme.icon} style={styles.icon} />
                        <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>City</Text>
                        <Text style={[styles.rowValue, { color: theme.text }]}>{profile?.city || '-'}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.row}>
                        <Ionicons name="calendar-outline" size={20} color={theme.icon} style={styles.icon} />
                        <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Age</Text>
                        <Text style={[styles.rowValue, { color: theme.text }]}>{profile?.age || '-'}</Text>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Settings</Text>

                    {isAdmin && (
                        <>
                            <TouchableOpacity style={styles.row} onPress={() => router.push('/admin/dashboard')}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} style={styles.icon} />
                                <Text style={[styles.rowLabel, { color: theme.text }]}>Admin Dashboard</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.icon} />
                            </TouchableOpacity>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        </>
                    )}

                    <TouchableOpacity style={styles.row} onPress={performLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={styles.icon} />
                        <Text style={[styles.rowLabel, { color: "#FF6B6B" }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    username: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    handle: {
        fontSize: 16,
    },
    section: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    icon: {
        marginRight: 12,
    },
    rowLabel: {
        fontSize: 16,
        flex: 1,
    },
    rowValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 8,
        marginLeft: 32,
    },
});
