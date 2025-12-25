import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    onHide: () => void;
    duration?: number;
}

const { width } = Dimensions.get('window');

// Golden Ratio Constants
const GR = 1.618;
const BASE_PADDING = 16;
const CONTAINER_WIDTH = width * 0.9; // ~90% width

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'info',
    onHide,
    duration = 3000,
}) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-50)).current; // Slide from top

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 50, // Top margin
                    useNativeDriver: true,
                    friction: 6,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hide();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hide();
        }
    }, [visible]);

    const hide = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -50,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (visible) onHide();
        });
    };

    const getIconName = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            default: return 'information-circle';
        }
    }

    const getStatusColor = () => {
        switch (type) {
            case 'success': return '#4ADE80';
            case 'error': return '#FB7185';
            default: return theme.primary;
        }
    }

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderLeftColor: getStatusColor(),
                    shadowColor: '#000',
                },
            ]}
        >
            <TouchableOpacity style={styles.content} onPress={hide} activeOpacity={0.8}>
                <Ionicons name={getIconName()} size={22} color={getStatusColor()} style={styles.icon} />
                <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 20, // Relative to safe area
        alignSelf: 'center',
        width: CONTAINER_WIDTH,
        borderRadius: 14,
        borderWidth: 1,
        borderLeftWidth: 6,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 9999,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    icon: {
        marginRight: 10,
    },
    text: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        lineHeight: 20,
    },
});
