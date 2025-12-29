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
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import { competitionService, Competition } from '../../services/competitionService';
import { useAuth } from '../../contexts/AuthContext';

export default function CompetitionsScreen() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetitions();
      // Sort by date (upcoming first)
      const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setCompetitions(sorted);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les compétitions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompetitions();
    setRefreshing(false);
  };

  const isRegistered = (competition: Competition) => {
    return competition.participants.includes(user?.id || '');
  };

  const isFull = (competition: Competition) => {
    return competition.participants.length >= competition.maxParticipants;
  };

  const handleRegister = async (competition: Competition) => {
    if (isRegistered(competition)) {
      // Unregister
      Alert.alert(
        'Se désinscrire',
        `Êtes-vous sûr de vouloir vous désinscrire de "${competition.name}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se désinscrire',
            style: 'destructive',
            onPress: async () => {
              try {
                await competitionService.unregisterFromCompetition(competition.id);
                Alert.alert('Succès', 'Vous êtes désinscrit de la compétition');
                loadCompetitions();
              } catch (error: any) {
                Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de se désinscrire');
              }
            }
          }
        ]
      );
    } else {
      // Register
      if (isFull(competition)) {
        Alert.alert('Complet', 'Cette compétition est complète');
        return;
      }

      Alert.alert(
        'Inscription',
        `Voulez-vous vous inscrire à "${competition.name}" ?${competition.entryFee > 0 ? `\n\nDroit de jeu: ${competition.entryFee} FCFA` : ''}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'S\'inscrire',
            onPress: async () => {
              try {
                await competitionService.registerForCompetition(competition.id);
                Alert.alert('Succès', 'Vous êtes inscrit à la compétition!');
                loadCompetitions();
              } catch (error: any) {
                Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de s\'inscrire');
              }
            }
          }
        ]
      );
    }
  };

  const getStatusColor = (competition: Competition) => {
    if (competition.status === 'completed') return '#6b7280';
    if (competition.status === 'cancelled') return '#ef4444';
    if (isFull(competition)) return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = (competition: Competition) => {
    if (competition.status === 'completed') return 'Terminée';
    if (competition.status === 'cancelled') return 'Annulée';
    if (competition.status === 'ongoing') return 'En cours';
    if (isFull(competition)) return 'Complet';
    return 'Places disponibles';
  };

  const renderCompetition = (competition: Competition) => {
    const registered = isRegistered(competition);
    const full = isFull(competition);
    const upcoming = isFuture(parseISO(competition.date));

    return (
      <View key={competition.id} style={styles.competitionCard}>
        <View style={styles.competitionHeader}>
          <View style={styles.competitionTitleRow}>
            <Ionicons name="trophy" size={24} color="#10b981" />
            <View style={styles.competitionTitleContainer}>
              <Text style={styles.competitionName}>{competition.name}</Text>
              <Text style={styles.competitionDate}>
                {format(parseISO(competition.date), 'EEEE dd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(competition) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(competition) }]}>
              {getStatusText(competition)}
            </Text>
          </View>
        </View>

        {competition.description && (
          <Text style={styles.competitionDescription}>{competition.description}</Text>
        )}

        <View style={styles.competitionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="people" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {competition.participants.length} / {competition.maxParticipants} participants
            </Text>
          </View>

          {competition.entryFee > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{competition.entryFee} FCFA</Text>
            </View>
          )}
        </View>

        {registered && (
          <View style={styles.registeredBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.registeredText}>Vous êtes inscrit</Text>
          </View>
        )}

        {upcoming && competition.status === 'upcoming' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              registered ? styles.unregisterButton : styles.registerButton,
              (!registered && full) && styles.buttonDisabled
            ]}
            onPress={() => handleRegister(competition)}
            disabled={!registered && full}
          >
            <Ionicons
              name={registered ? 'close-circle' : 'add-circle'}
              size={20}
              color={registered ? '#ef4444' : '#ffffff'}
            />
            <Text style={[
              styles.actionButtonText,
              registered && styles.unregisterButtonText
            ]}>
              {registered ? 'Se désinscrire' : full ? 'Complet' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Ionicons name="trophy" size={48} color="#10b981" />
          <Text style={styles.headerTitle}>Compétitions</Text>
          <Text style={styles.headerSubtitle}>
            Inscrivez-vous aux tournois et compétitions
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 48 }} />
        ) : competitions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>Aucune compétition</Text>
            <Text style={styles.emptySubtext}>
              Les compétitions à venir apparaîtront ici
            </Text>
          </View>
        ) : (
          <View style={styles.competitionsList}>
            {competitions.map(renderCompetition)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  scrollView: {
    flex: 1
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center'
  },
  competitionsList: {
    padding: 16
  },
  competitionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  competitionHeader: {
    marginBottom: 12
  },
  competitionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  competitionTitleContainer: {
    flex: 1,
    marginLeft: 12
  },
  competitionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  competitionDate: {
    fontSize: 14,
    color: '#6b7280'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  competitionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12
  },
  competitionDetails: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8
  },
  registeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  registeredText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8
  },
  registerButton: {
    backgroundColor: '#10b981'
  },
  unregisterButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  buttonDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8
  },
  unregisterButtonText: {
    color: '#ef4444'
  },
  emptyState: {
    alignItems: 'center',
    padding: 48
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center'
  }
});
