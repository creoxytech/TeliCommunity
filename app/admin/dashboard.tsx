import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type Booking = {
    id: string;
    booking_date: string;
    title: string;
    description: string;
    booked_by: string;
    status: string;
    profiles: {
        full_name: string;
        username: string;
    };
};

export default function AdminDashboard() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);

        // Fetch Pending with user details
        const { data: pendingData, error: pendingError } = await supabase
            .from('temple_bookings')
            .select('*, profiles!temple_bookings_booked_by_profiles_fkey(full_name, username)')
            .eq('status', 'pending')
            .order('booking_date', { ascending: true });

        if (pendingError) {
            console.error('Error fetching pending:', pendingError);
            Alert.alert('Error', 'Could not load pending requests');
        } else {
            setPendingBookings(pendingData || []);
        }

        // Fetch Stats
        const { count: totalCount } = await supabase.from('temple_bookings').select('*', { count: 'exact', head: true });
        const { count: approvedCount } = await supabase.from('temple_bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved');

        setStats({
            total: totalCount || 0,
            pending: pendingData?.length || 0,
            approved: approvedCount || 0
        });

        setLoading(false);
    };

    const handleApprove = async (id: string, date: string) => {
        // Optimistic Update
        setPendingBookings(prev => prev.filter(b => b.id !== id));

        const { error } = await supabase
            .from('temple_bookings')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) {
            Alert.alert('Error', 'Failed to approve');
            fetchDashboardData(); // Revert on error
        } else {
            Alert.alert('Success', `Booking for ${date} Approved`);
            fetchDashboardData(); // Sync stats
        }
    };

    const handleReject = async (id: string) => {
        Alert.alert(
            'Confirm Rejection',
            'This will permanently delete the booking request and free up the slot. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject & Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setPendingBookings(prev => prev.filter(b => b.id !== id));
                        const { error } = await supabase
                            .from('temple_bookings')
                            .delete()
                            .eq('id', id);

                        if (error) {
                            Alert.alert('Error', 'Failed to reject');
                            fetchDashboardData();
                        } else {
                            fetchDashboardData();
                        }
                    }
                }
            ]
        );
    };

    const renderPendingItem = ({ item }: { item: Booking }) => (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.cardDate, { color: theme.primary }]}>
                        {new Date(item.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
                    <Text style={[styles.badgeText, { color: '#FF9800' }]}>PENDING</Text>
                </View>
            </View>

            <Text style={[styles.userText, { color: theme.textSecondary }]}>
                Requested by: <Text style={{ fontWeight: '600', color: theme.text }}>{item.profiles?.full_name || 'Unknown'}</Text> (@{item.profiles?.username})
            </Text>

            {item.description && (
                <Text style={[styles.descText, { color: theme.textSecondary }]}>{item.description}</Text>
            )}

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item.id)}
                >
                    <Ionicons name="close-circle-outline" size={20} color="#D32F2F" />
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(item.id, item.booking_date)}
                >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#2E7D32" />
                    <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Admin Dashboard', headerBackTitle: 'Back' }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Analytics Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.total}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.pending}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.approved}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Confirmed</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Pending Requests</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                ) : pendingBookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.icon} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No pending requests</Text>
                    </View>
                ) : (
                    <FlatList
                        data={pendingBookings}
                        renderItem={renderPendingItem}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                    />
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 14,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    userText: {
        fontSize: 14,
        marginBottom: 8,
    },
    descText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    rejectBtn: {
        backgroundColor: '#FFEBEE',
        borderColor: '#FFEBEE',
    },
    approveBtn: {
        backgroundColor: '#E8F5E9',
        borderColor: '#E8F5E9',
    },
    rejectText: {
        color: '#D32F2F',
        fontWeight: '600',
        marginLeft: 6,
    },
    approveText: {
        color: '#2E7D32',
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
});
