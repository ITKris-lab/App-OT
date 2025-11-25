
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Surface,
  Paragraph,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ticket, User, TicketCategory } from '../types';

// Constantes
const TICKET_CATEGORIES: { value: TicketCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'hardware', label: 'Hardware', icon: 'hardware-chip-outline' },
  { value: 'software', label: 'Software', icon: 'apps-outline' },
  { value: 'network', label: 'Redes', icon: 'wifi-outline' },
  { value: 'printer', label: 'Impresoras', icon: 'print-outline' },
  { value: 'user_support', label: 'Soporte Usuario', icon: 'person-circle-outline' },
  { value: 'other', label: 'Otro', icon: 'help-circle-outline' },
];

export default function AdminScreen() {
  const navigation = useNavigation();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubTickets = onSnapshot(ticketsQuery, snapshot => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() ?? new Date() } as Ticket));
      setAllTickets(ticketsData);
      checkLoading();
    });

    const unsubUsers = onSnapshot(usersQuery, snapshot => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() ?? new Date() } as User));
      setAllUsers(usersData);
      checkLoading();
    });

    let loaded = { tickets: false, users: false };
    const checkLoading = () => {
      // Simulación simple de carga
      setIsLoading(false);
    }

    return () => { unsubTickets(); unsubUsers(); };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Title style={styles.headerTitle}>Panel de Administración</Title>
      </Surface>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          
          {/* Tarjeta Principal: Gestión de Usuarios */}
          <Card style={[styles.card, styles.mainActionCard]}>
            <Card.Content style={{ alignItems: 'center', padding: 20 }}>
              <Ionicons name="people-circle-outline" size={64} color="#2E7D32" />
              <Title style={{ marginTop: 16 }}>Gestión de Usuarios</Title>
              <Paragraph style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
                Administrar cuentas, roles y sectores del personal.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('AdminUsers' as never)} 
                style={{ backgroundColor: '#2E7D32', width: '100%' }}
                icon="account-cog"
              >
                Ir a Gestión de Usuarios
              </Button>
            </Card.Content>
          </Card>

          {/* Estadísticas Rápidas */}
          <View style={styles.statsRow}>
             <Card style={[styles.card, styles.statCard]}>
                <Card.Content style={{ alignItems: 'center' }}>
                    <Title style={styles.statNumber}>{allUsers.length}</Title>
                    <Paragraph style={styles.statLabel}>Usuarios</Paragraph>
                </Card.Content>
             </Card>
             <Card style={[styles.card, styles.statCard]}>
                <Card.Content style={{ alignItems: 'center' }}>
                    <Title style={styles.statNumber}>{allTickets.length}</Title>
                    <Paragraph style={styles.statLabel}>Tickets Totales</Paragraph>
                </Card.Content>
             </Card>
             <Card style={[styles.card, styles.statCard]}>
                <Card.Content style={{ alignItems: 'center' }}>
                    <Title style={[styles.statNumber, {color: '#F44336'}]}>
                        {allTickets.filter(t => t.status === 'open').length}
                    </Title>
                    <Paragraph style={styles.statLabel}>Abiertos</Paragraph>
                </Card.Content>
             </Card>
          </View>

          {/* Resumen de Tickets por Categoría */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Tickets por Categoría</Title>
              {TICKET_CATEGORIES.map(category => {
                const count = allTickets.filter(t => t.category === category.value).length;
                if (count === 0) return null;
                return (
                  <View key={category.value} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <Ionicons name={category.icon as any} size={20} color="#666" />
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                    </View>
                    <Text style={styles.categoryCount}>{count}</Text>
                  </View>
                );
              })}
            </Card.Content>
          </Card>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: 'white', padding: 16, elevation: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  card: { marginBottom: 16, elevation: 2, backgroundColor: 'white' },
  mainActionCard: { borderLeftWidth: 4, borderLeftColor: '#2E7D32' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginBottom: 16 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoryInfo: { flexDirection: 'row', alignItems: 'center' },
  categoryLabel: { fontSize: 14, color: '#333', marginLeft: 12 },
  categoryCount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
});
