import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useAuth } from '../ctx/AuthContext';
import { useToast } from '../ctx/ToastContext';
import { useColorScheme } from '../hooks/use-color-scheme';
import { supabase } from '../lib/supabase';

export default function SetupProfile() {
    const { session, refreshProfile } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const systemColorScheme = useColorScheme();
    const { showToast } = useToast();

    const theme = Colors[systemColorScheme ?? 'light'];

    // Form State
    const [fullName, setFullName] = useState(session?.user.user_metadata?.full_name || '');
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [city, setCity] = useState('');
    const [image, setImage] = useState<string | null>(session?.user.user_metadata?.avatar_url || null);
    const [base64, setBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
                if (result.assets[0].base64) {
                    setBase64(result.assets[0].base64);
                }
            }
        } catch (e) {
            showToast('Failed to pick image', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!fullName.trim() || !username.trim() || !age.trim() || !city.trim()) {
            showToast('All fields are mandatory', 'error');
            return;
        }

        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 13) {
            showToast('Minimum age is 13 years', 'error');
            return;
        }

        if (username.length < 3) {
            showToast('Username too short', 'error');
            return;
        }

        setLoading(true);
        try {
            // 1. Check username uniqueness
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .maybeSingle();

            if (existingUser && existingUser.id !== session?.user.id) {
                showToast('Username already taken', 'error');
                setLoading(false);
                return;
            }

            // 2. Upload Image if changed
            let finalImageUrl = image;
            if (base64 && session?.user.id) {
                const filePath = `${session.user.id}/avatar_${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, decode(base64), {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrl;
            }

            // 3. Save Profile
            const updates = {
                id: session?.user.id,
                full_name: fullName,
                username: username,
                age: ageNum,
                city: city,
                avatar_url: finalImageUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            showToast('Profile created successfully!', 'success');

            // Give time for toast to be seen before redirect
            setTimeout(async () => {
                await refreshProfile();
            }, 1000);

        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={systemColorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Setup Profile</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join our community with your details.</Text>
                </View>

                <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                    {image ? (
                        <Image source={{ uri: image }} style={[styles.avatar, { borderColor: theme.primary }]} />
                    ) : (
                        <View style={[styles.placeholderAvatar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Ionicons name="camera" size={32} color={theme.icon} />
                        </View>
                    )}
                    <Text style={[styles.imageText, { color: theme.primary }]}>Upload Photo</Text>
                </TouchableOpacity>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter Full Name"
                            placeholderTextColor={theme.icon}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                            value={username}
                            onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))}
                            placeholder="rahul_p"
                            placeholderTextColor={theme.icon}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Age</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                value={age}
                                onChangeText={setAge}
                                placeholder="24"
                                placeholderTextColor={theme.icon}
                                keyboardType="number-pad"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 2 }]}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>City</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                value={city}
                                onChangeText={setCity}
                                placeholder="Pune"
                                placeholderTextColor={theme.icon}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Complete Setup</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
        marginTop: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        marginBottom: 12,
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
    },
    imageText: {
        fontSize: 14,
        fontWeight: '600',
    },
    form: {
        gap: 20,
    },
    row: {
        flexDirection: 'row',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    button: {
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000', // Default shadow color, theme.primary is used for background
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
