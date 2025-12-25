import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Configure notifications to show even when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, // Kept for Android compatibility if needed, but adding required props
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        setupNotifications();
        checkAdmin();
    }, []);

    const setupNotifications = async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
    };

    useEffect(() => {
        let subscription: any;

        if (isAdmin) {
            // Initial count fetch for badge
            fetchPendingCount();

            // Subscribe to new bookings
            subscription = supabase
                .channel('admin-notifications')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'temple_bookings' },
                    async (payload) => {
                        const newBooking = payload.new as any;
                        if (newBooking.status === 'pending') {
                            await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: 'New Booking Request',
                                    body: `${newBooking.title} by a devotee.`,
                                    data: { bookingId: newBooking.id },
                                },
                                trigger: null, // Immediate
                            });
                            setPendingCount(prev => prev + 1);
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'DELETE', schema: 'public', table: 'temple_bookings' },
                    () => {
                        // Refresh count on delete (rejection)
                        fetchPendingCount();
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'temple_bookings' },
                    () => {
                        // Refresh count on update (approval)
                        fetchPendingCount();
                    }
                )
                .subscribe();
        }

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [isAdmin]);

    // General User Notifications (New Confirmed Events)
    useEffect(() => {
        const subscription = supabase
            .channel('public-events')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'temple_bookings' },
                async (payload) => {
                    const newRecord = payload.new as any;
                    // Trigger notification if the event is approved
                    if (newRecord.status === 'approved') {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: 'Event Confirmed! 🎉',
                                body: `${newRecord.title} has been officially scheduled.`,
                            },
                            trigger: null,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
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

    const fetchPendingCount = async () => {
        const { count } = await supabase
            .from('temple_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        setPendingCount(count || 0);
    };

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.tabIconSelected,
                tabBarInactiveTintColor: theme.tabIconDefault,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.border,
                    ...Platform.select({
                        ios: {
                            position: 'absolute',
                        },
                        default: {},
                    }),
                },
                tabBarShowLabel: true,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Temple',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="matrimony"
                options={{
                    title: 'Vadhu Var',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="moments"
                options={{
                    title: 'Moments',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'camera' : 'camera-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarBadge: isAdmin && pendingCount > 0 ? pendingCount : undefined,
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="events"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
