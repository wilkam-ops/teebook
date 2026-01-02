import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage);

  const pickImage = async () => {
    // Demander la permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à vos photos');
      return;
    }

    // Ouvrir la galerie
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await uploadProfileImage(result.assets[0].base64);
    }
  };

  const uploadProfileImage = async (base64Image: string) => {
    try {
      setUploading(true);
      const imageData = `data:image/jpeg;base64,${base64Image}`;
      
      await api.put('/auth/profile-image', {
        profile_image: imageData
      });
      
      setProfileImage(imageData);
      Alert.alert('Succès', 'Photo de profil mise à jour!');
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#ffffff" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="camera" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.handicapIndex && (
            <View style={styles.indexBadge}>
              <Ionicons name="trophy" size={16} color="#10b981" />
              <Text style={styles.indexText}>Index: {user.handicapIndex}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Statut</Text>
                <Text style={styles.infoValue}>
                  {user?.isActive ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Membre depuis</Text>
                <Text style={styles.infoValue}>
                  {new Date(user?.createdAt || '').toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#10b981',
    padding: 24,
    alignItems: 'center',
    paddingTop: 40
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  indexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12
  },
  indexText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 6
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  infoContent: {
    flex: 1,
    marginLeft: 12
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fee2e2'
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8
  }
});
