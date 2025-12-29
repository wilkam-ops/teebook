import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { bookingService, Course, TeeTime, Booking, GuestPlayer } from '../../services/bookingService';

type Tab = 'new' | 'upcoming';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTeeTime, setSelectedTeeTime] = useState<TeeTime | null>(null);
  const [playersCount, setPlayersCount] = useState(1);
  const [guestPlayers, setGuestPlayers] = useState<GuestPlayer[]>([]);

  useEffect(() => {
    loadCourses();
    if (activeTab === 'upcoming') {
      loadMyBookings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      loadTeeTimes();
    }
  }, [selectedCourse, selectedDate]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getCourses();
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les parcours');
    } finally {
      setLoading(false);
    }
  };

  const loadTeeTimes = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getTeeTimes(selectedDate, selectedCourse?.id);
      setTeeTimes(data);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les créneaux');
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyBookings();
      setMyBookings(data.filter(b => b.status === 'confirmed'));
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger vos réservations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'new') {
      await loadCourses();
      if (selectedCourse) await loadTeeTimes();
    } else {
      await loadMyBookings();
    }
    setRefreshing(false);
  };

  const handleBookTeeTime = (teeTime: TeeTime) => {
    if (teeTime.availableSlots === 0) {
      Alert.alert('Complet', 'Ce créneau est complet');
      return;
    }
    setSelectedTeeTime(teeTime);
    setPlayersCount(1);
    setGuestPlayers([]);
    setShowBookingModal(true);
  };

  const addGuestPlayer = () => {
    if (playersCount >= 4) {
      Alert.alert('Limite atteinte', 'Maximum 4 joueurs par réservation');
      return;
    }
    setPlayersCount(playersCount + 1);
    setGuestPlayers([...guestPlayers, { name: '', handicapIndex: undefined }]);
  };

  const removeGuestPlayer = (index: number) => {
    const newGuests = [...guestPlayers];
    newGuests.splice(index, 1);
    setGuestPlayers(newGuests);
    setPlayersCount(playersCount - 1);
  };

  const updateGuestPlayer = (index: number, field: keyof GuestPlayer, value: any) => {
    const newGuests = [...guestPlayers];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuestPlayers(newGuests);
  };

  const confirmBooking = async () => {
    if (!selectedTeeTime) return;

    if (playersCount > selectedTeeTime.availableSlots) {
      Alert.alert('Erreur', `Seulement ${selectedTeeTime.availableSlots} place(s) disponible(s)`);
      return;
    }

    try {
      setLoading(true);
      await bookingService.createBooking({
        teeTimeId: selectedTeeTime.id,
        playersCount,
        guestPlayers: guestPlayers.filter(g => g.name.trim() !== '')
      });
      Alert.alert('Succès', 'Réservation confirmée!');
      setShowBookingModal(false);
      loadTeeTimes();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de créer la réservation');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancelBooking(bookingId);
              Alert.alert('Succès', 'Réservation annulée');
              loadMyBookings();
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible d\'annuler la réservation');
            }
          }
        }
      ]
    );
  };

  const renderNewBooking = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Course Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parcours</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {courses.map(course => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseCard,
                selectedCourse?.id === course.id && styles.courseCardSelected
              ]}
              onPress={() => setSelectedCourse(course)}
            >
              <Ionicons
                name="golf"
                size={24}
                color={selectedCourse?.id === course.id ? '#10b981' : '#6b7280'}
              />
              <Text style={[
                styles.courseName,
                selectedCourse?.id === course.id && styles.courseNameSelected
              ]}>
                {course.name}
              </Text>
              <Text style={styles.courseHoles}>{course.holesCount} trous</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Calendar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date</Text>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          minDate={format(new Date(), 'yyyy-MM-dd')}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: '#10b981'
            }
          }}
          theme={{
            selectedDayBackgroundColor: '#10b981',
            todayTextColor: '#10b981',
            arrowColor: '#10b981'
          }}
        />
      </View>

      {/* Tee Times */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 24 }} />
        ) : teeTimes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Aucun créneau disponible</Text>
          </View>
        ) : (
          teeTimes.map(teeTime => (
            <TouchableOpacity
              key={teeTime.id}
              style={styles.teeTimeCard}
              onPress={() => handleBookTeeTime(teeTime)}
              disabled={teeTime.availableSlots === 0}
            >
              <View style={styles.teeTimeLeft}>
                <Ionicons name="time" size={24} color="#10b981" />
                <Text style={styles.teeTimeTime}>{teeTime.time}</Text>
              </View>
              <View style={styles.teeTimeRight}>
                <Text style={[
                  styles.teeTimeSlots,
                  teeTime.availableSlots === 0 && styles.teeTimeFull
                ]}>
                  {teeTime.availableSlots === 0 ? 'Complet' : `${teeTime.availableSlots} place(s)`}
                </Text>
                <Ionicons
                  name={teeTime.availableSlots === 0 ? 'close-circle' : 'chevron-forward'}
                  size={20}
                  color={teeTime.availableSlots === 0 ? '#ef4444' : '#10b981'}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderUpcomingBookings = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 24 }} />
      ) : myBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>Aucune réservation</Text>
          <Text style={styles.emptySubtext}>Vos réservations apparaîtront ici</Text>
        </View>
      ) : (
        myBookings.map(booking => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Ionicons name="calendar" size={24} color="#10b981" />
              <Text style={styles.bookingDate}>
                {format(parseISO(booking.createdAt), 'dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
            <View style={styles.bookingDetails}>
              <View style={styles.bookingRow}>
                <Ionicons name="people" size={16} color="#6b7280" />
                <Text style={styles.bookingText}>
                  {booking.playersCount} joueur(s)
                </Text>
              </View>
              {booking.guestPlayers.length > 0 && (
                <View style={styles.guestList}>
                  <Text style={styles.guestLabel}>Invités:</Text>
                  {booking.guestPlayers.map((guest, index) => (
                    <Text key={index} style={styles.guestName}>
                      • {guest.name}
                      {guest.handicapIndex && ` (Index: ${guest.handicapIndex})`}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => cancelBooking(booking.id)}
            >
              <Ionicons name="close-circle" size={16} color="#ef4444" />
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            Nouvelle réservation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Mes réservations
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? renderNewBooking() : renderUpcomingBookings()}

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmer la réservation</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.modalLabel}>
                Créneau: {selectedTeeTime?.time}
              </Text>
              <Text style={styles.modalLabel}>
                Date: {format(parseISO(selectedDate), 'dd MMMM yyyy', { locale: fr })}
              </Text>

              <View style={styles.playersSection}>
                <Text style={styles.modalSubtitle}>Nombre de joueurs: {playersCount}</Text>
                
                {guestPlayers.map((guest, index) => (
                  <View key={index} style={styles.guestInput}>
                    <TextInput
                      style={styles.input}
                      placeholder={`Nom de l'invité ${index + 1}`}
                      value={guest.name}
                      onChangeText={(text) => updateGuestPlayer(index, 'name', text)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 0.4 }]}
                      placeholder="Index"
                      keyboardType="numeric"
                      value={guest.handicapIndex?.toString() || ''}
                      onChangeText={(text) => updateGuestPlayer(index, 'handicapIndex', text ? parseFloat(text) : undefined)}
                    />
                    <TouchableOpacity onPress={() => removeGuestPlayer(index)}>
                      <Ionicons name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                {playersCount < 4 && (
                  <TouchableOpacity style={styles.addButton} onPress={addGuestPlayer}>
                    <Ionicons name="add-circle" size={20} color="#10b981" />
                    <Text style={styles.addButtonText}>Ajouter un invité</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmBooking}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer la réservation</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center'
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#10b981'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  tabTextActive: {
    color: '#10b981'
  },
  scrollView: {
    flex: 1
  },
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12
  },
  courseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center'
  },
  courseCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4'
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center'
  },
  courseNameSelected: {
    color: '#10b981'
  },
  courseHoles: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4
  },
  teeTimeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 8
  },
  teeTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  teeTimeTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12
  },
  teeTimeRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  teeTimeSlots: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginRight: 8
  },
  teeTimeFull: {
    color: '#ef4444'
  },
  emptyState: {
    alignItems: 'center',
    padding: 48
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12
  },
  bookingDetails: {
    marginBottom: 12
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  bookingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8
  },
  guestList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  guestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4
  },
  guestName: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    marginBottom: 2
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  modalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12
  },
  playersSection: {
    marginTop: 16
  },
  guestInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
    marginTop: 8
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 6
  },
  confirmButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  }
});
