import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  profiles?: {
    full_name: string;
  };
};

export default function TempleScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Booking Form State
  const [showModal, setShowModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('temple_bookings')
      .select('*, profiles!temple_bookings_booked_by_profiles_fkey(full_name)')
      .gte('booking_date', today)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleBook = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Required', 'Please enter an event title');
      return;
    }

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Error', 'You must be logged in to book');
      setSubmitting(false);
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];

    // Default status is 'pending' from DB definition, but good to be explicit for clarity
    const { error } = await supabase
      .from('temple_bookings')
      .insert({
        booking_date: dateStr,
        title: eventTitle,
        description: eventDesc,
        booked_by: session.user.id,
        status: 'pending'
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        Alert.alert('Unavailable', 'This date has just been requested/booked by someone else.');
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      Alert.alert('Success', 'Booking requested! Waiting for admin approval.');
      setEventTitle('');
      setEventDesc('');
      setShowModal(false);
      fetchBookings();
    }
    setSubmitting(false);
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDateBooking = bookings.find(b => b.booking_date === selectedDateStr);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.headerAccent, { backgroundColor: theme.primary }]} />
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Sant Jagnade Maharaj Temple</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={theme.primary} />
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Alandi, Pune</Text>
            </View>
          </View>
        </View>

        {/* Date Selection Section */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Select Date</Text>

          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.icon} style={{ marginRight: 8 }} />
              <Text style={[styles.dateButtonText, { color: theme.text }]}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.statusContainer}>
            {selectedDateBooking ? (
              <View style={styles.statusLocked}>
                <View style={[styles.statusIndicator, {
                  backgroundColor: selectedDateBooking.status === 'approved' ? '#FF8A65' : '#FFD54F'
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {selectedDateBooking.status === 'approved' ? 'Reserved' : 'Request Pending'}
                  </Text>
                  <Text style={[styles.statusSubtext, { color: theme.text, fontWeight: '700', fontSize: 16 }]}>
                    "{selectedDateBooking.title}"
                  </Text>
                  <Text style={[styles.statusSubtext, { color: theme.textSecondary, marginTop: 4, fontStyle: 'italic' }]}>
                    By: {selectedDateBooking.profiles?.full_name || 'Unknown'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.statusAvailable}>
                <View style={[styles.statusIndicator, { backgroundColor: '#81C784' }]} />
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>Available for Booking</Text>
              </View>
            )}
          </View>

          {!selectedDateBooking && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]} // Soft Primary
              onPress={() => setShowModal(true)}
            >
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>Request Booking</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upcoming Events List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Upcoming Approved Events</Text>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : bookings.filter(b => b.status === 'approved').length === 0 ? (
            <Text style={{ color: theme.textSecondary }}>No upcoming events confirmed.</Text>
          ) : (
            bookings
              .filter(b => b.status === 'approved')
              .map((booking) => (
                <View key={booking.id} style={[styles.upcomingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.dateColumn}>
                    <Text style={[styles.dateDay, { color: theme.text }]}>{new Date(booking.booking_date).getDate()}</Text>
                    <Text style={[styles.dateMonth, { color: theme.textSecondary }]}>{new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short' })}</Text>
                  </View>
                  <View style={styles.upcomingContent}>
                    <Text style={[styles.upcomingTitle, { color: theme.text }]}>{booking.title}</Text>
                    <Text style={[styles.upcomingDate, { color: theme.textSecondary }]}>
                      {new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long' })} • By {booking.profiles?.full_name || 'Unknown'}
                    </Text>
                    {booking.description ? (
                      <Text style={[styles.upcomingDesc, { color: theme.textSecondary, marginTop: 4 }]} numberOfLines={2}>
                        {booking.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Booking Modal */}
        <Modal
          visible={showModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Request Booking</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                {selectedDate.toLocaleDateString()}
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Event Title"
                placeholderTextColor={theme.icon}
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Description (Optional)"
                placeholderTextColor={theme.icon}
                value={eventDesc}
                onChangeText={setEventDesc}
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={handleBook}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.bookButtonText}>Send Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
    paddingBottom: 40,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAccent: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusLocked: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  upcomingCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  dateColumn: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  upcomingDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  upcomingDesc: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  bookButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
