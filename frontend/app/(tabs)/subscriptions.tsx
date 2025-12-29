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
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { subscriptionService, Subscription } from '../../services/subscriptionService';

export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getMySubscriptions();
      // Sort by date (most recent first)
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSubscriptions(sorted);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les abonnements');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptions();
    setRefreshing(false);
  };

  const getActiveSubscription = () => {
    return subscriptions.find(sub => sub.status === 'active');
  };

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(parseISO(endDate), new Date());
  };

  const requestRenewal = () => {
    Alert.alert(
      'Demande de renouvellement',
      'Votre demande de renouvellement d\'abonnement a été envoyée à l\'administration. Vous serez contacté prochainement.',
      [{ text: 'OK' }]
    );
  };

  const renderActiveSubscription = (subscription: Subscription) => {
    const daysRemaining = getDaysRemaining(subscription.endDate);
    const isExpiringSoon = daysRemaining <= 30;

    return (
      <View style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          <View style={styles.activeInfo}>
            <Text style={styles.activeTitle}>Abonnement actif</Text>
            <Text style={styles.activeType}>{subscription.type}</Text>
          </View>
        </View>

        <View style={styles.activeDates}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Début</Text>
            <Text style={styles.dateValue}>
              {format(parseISO(subscription.startDate), 'dd MMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View style={styles.dateSeparator} />
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Fin</Text>
            <Text style={[
              styles.dateValue,
              isExpiringSoon && styles.dateValueWarning
            ]}>
              {format(parseISO(subscription.endDate), 'dd MMM yyyy', { locale: fr })}
            </Text>
          </View>
        </View>

        <View style={[
          styles.daysRemainingBox,
          isExpiringSoon && styles.daysRemainingBoxWarning
        ]}>
          <Ionicons
            name="time"
            size={20}
            color={isExpiringSoon ? '#f59e0b' : '#10b981'}
          />
          <Text style={[
            styles.daysRemainingText,
            isExpiringSoon && styles.daysRemainingTextWarning
          ]}>
            {daysRemaining} jour(s) restant(s)
          </Text>
        </View>

        {isExpiringSoon && (
          <TouchableOpacity style={styles.renewButton} onPress={requestRenewal}>
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.renewButtonText}>Demander un renouvellement</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSubscriptionHistory = () => {
    const history = subscriptions.filter(sub => sub.status === 'expired');

    if (history.length === 0) {
      return null;
    }

    return (
      <View style={styles.historySection}>
        <Text style={styles.historySectionTitle}>Historique</Text>
        {history.map(subscription => (
          <View key={subscription.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.historyType}>{subscription.type}</Text>
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>Expiré</Text>
              </View>
            </View>
            <View style={styles.historyDates}>
              <Text style={styles.historyDate}>
                {format(parseISO(subscription.startDate), 'dd MMM yyyy', { locale: fr })}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
              <Text style={styles.historyDate}>
                {format(parseISO(subscription.endDate), 'dd MMM yyyy', { locale: fr })}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderNoSubscription = () => (
    <View style={styles.noSubscriptionCard}>
      <Ionicons name="alert-circle-outline" size={48} color="#f59e0b" />
      <Text style={styles.noSubscriptionTitle}>Aucun abonnement actif</Text>
      <Text style={styles.noSubscriptionText}>
        Vous n'avez pas d'abonnement actif pour le moment.
        Contactez l'administration pour souscrire à un abonnement.
      </Text>
      <TouchableOpacity style={styles.contactButton} onPress={requestRenewal}>
        <Ionicons name="mail" size={20} color="#10b981" />
        <Text style={styles.contactButtonText}>Contacter l'administration</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Ionicons name="card" size={48} color="#10b981" />
          <Text style={styles.headerTitle}>Mes abonnements</Text>
          <Text style={styles.headerSubtitle}>
            Gérez vos abonnements et adhésions
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 48 }} />
        ) : (
          <View style={styles.content}>
            {getActiveSubscription() ? (
              <>
                {renderActiveSubscription(getActiveSubscription()!)}
                {renderSubscriptionHistory()}
              </>
            ) : subscriptions.length > 0 ? (
              <>
                {renderNoSubscription()}
                {renderSubscriptionHistory()}
              </>
            ) : (
              renderNoSubscription()
            )}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>À propos des abonnements</Text>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={styles.infoText}>
              Les abonnements vous donnent accès illimité aux créneaux de jeu
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={styles.infoText}>
              Renouvelez votre abonnement avant son expiration pour éviter toute interruption
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={styles.infoText}>
              Pour toute question, contactez l'administration du golf
            </Text>
          </View>
        </View>
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
  content: {
    padding: 16
  },
  activeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#d1fae5'
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  activeInfo: {
    flex: 1,
    marginLeft: 12
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4
  },
  activeType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  activeDates: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  dateItem: {
    flex: 1,
    alignItems: 'center'
  },
  dateSeparator: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  dateValueWarning: {
    color: '#f59e0b'
  },
  daysRemainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  daysRemainingBoxWarning: {
    backgroundColor: '#fef3c7'
  },
  daysRemainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8
  },
  daysRemainingTextWarning: {
    color: '#f59e0b'
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 12
  },
  renewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8
  },
  historySection: {
    marginTop: 16
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1
  },
  historyBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280'
  },
  historyDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  historyDate: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8
  },
  noSubscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24
  },
  noSubscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8
  },
  noSubscriptionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5'
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 8
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 12
  }
});
