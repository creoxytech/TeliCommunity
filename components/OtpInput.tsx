import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputKeyPressEventData, View } from 'react-native';

interface OtpInputProps {
    length?: number;
    value: string;
    onCodeFilled?: (code: string) => void;
    onChange?: (code: string) => void;
}

export function OtpInput({ length = 6, value, onCodeFilled, onChange }: OtpInputProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [code, setCode] = useState<string[]>(new Array(length).fill(''));
    const inputs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        // Sync internal state with external value prop if it changes externally (e.g. clear)
        if (value !== code.join('')) {
            const splitValue = value.split('');
            const newCode = new Array(length).fill('');
            for (let i = 0; i < length; i++) {
                newCode[i] = splitValue[i] || '';
            }
            setCode(newCode);
        }
    }, [value]);

    const handleChangeText = (text: string, index: number) => {
        const newCode = [...code];

        // Handle paste
        if (text.length > 1) {
            const pastedCode = text.slice(0, length).split('');
            for (let i = 0; i < length; i++) {
                newCode[i] = pastedCode[i] || '';
            }
            setCode(newCode);
            if (onChange) onChange(newCode.join(''));
            if (onCodeFilled && newCode.join('').length === length) {
                onCodeFilled(newCode.join(''));
            }
            inputs.current[length - 1]?.focus();
            return;
        }

        newCode[index] = text;
        setCode(newCode);
        if (onChange) onChange(newCode.join(''));

        // Auto focus next
        if (text && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }

        if (onCodeFilled && newCode.join('').length === length) {
            onCodeFilled(newCode.join(''));
        }
    };

    const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!code[index] && index > 0) {
                inputs.current[index - 1]?.focus();
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
                if (onChange) onChange(newCode.join(''));
            }
        }
    };

    return (
        <View style={styles.container}>
            {code.map((digit, index) => (
                <TextInput
                    key={index}
                    style={[
                        styles.box,
                        {
                            borderColor: digit ? theme.primary : theme.icon,
                            backgroundColor: theme.surface || theme.background,
                            color: theme.text,
                        },
                        digit ? { shadowColor: theme.primary, elevation: 5 } : undefined
                    ]}
                    value={digit}
                    onChangeText={(text) => handleChangeText(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={length > 1 ? length : 1} // Allow paste length on first input essentially, restricted by logic
                    ref={(ref) => { inputs.current[index] = ref; }}
                    selectTextOnFocus
                    testID={`otp-input-${index}`}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginVertical: 20,
    },
    box: {
        width: 45,
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600',
    },
});
