
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  Surface,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ticket, User, TicketStatus } from '../types';

// Constantes
const TICKET_STATUSES: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Abierto', color: '#2196F3' },
  { value: 'in_progress', label: 'En Progreso', color: '#FF9800' },
  { value: 'pending', label: 'Pendiente', color: '#9C27B0' },
  { value: 'resolved', label: 'Resuelto', color: '#1B5E20' },
  { value: 'closed', label: 'Cerrado', color: '#607D8B' },
];

const HOSPITAL_INFO = {
  name: 'Hospital de Collipulli',
  address: 'Av. Manuel Rodriguez 1671, Collipulli, Chile',
  phone: '45-2-602066 Anexo 454066',
  email: 'christopher.burdiles@araucanianorte.cl',
};

// Helper para determinar si un color es claro u oscuro
const isColorLight = (color: string): boolean => {
  if (!color || !color.startsWith('#')) return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

interface HomeScreenProps {
  user: User;
}

export default function HomeScreen({ user }: HomeScreenProps) {
  const navigation = useNavigation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    let ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'), limit(10));

    if (user.role !== 'admin') {
      ticketsQuery = query(ticketsQuery, where('createdBy', '==', user.id));
    }

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          resolvedAt: data.resolvedAt?.toDate(),
        } as Ticket;
      });
      setTickets(ticketsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: Ticket['status']) => TICKET_STATUSES.find(s => s.value === status)?.color || '#666';

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'low': return '#1B5E20';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#666';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getRoleDisplayName = (role: User['role']) => ({ admin: 'Administrador', patient: 'Paciente' }[role] || 'Usuario');

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Surface style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View>
              <Title style={styles.greeting}>{getGreeting()}, {user?.name}</Title>
              <Paragraph style={styles.role}>{getRoleDisplayName(user?.role)}</Paragraph>
            </View>
            <MaterialCommunityIcons name="hospital-box-outline" size={40} color="white" />
          </View>
        </Surface>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Resumen de Mis Tickets</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statNumber}>{tickets.length}</Text><Text style={styles.statLabel}>Total</Text></View>
              <View style={styles.statItem}><Text style={[styles.statNumber, { color: '#2196F3' }]}>{tickets.filter(t => t.status === 'open').length}</Text><Text style={styles.statLabel}>Abiertos</Text></View>
              <View style={styles.statItem}><Text style={[styles.statNumber, { color: '#FF9800' }]}>{tickets.filter(t => t.status === 'in_progress').length}</Text><Text style={styles.statLabel}>En Progreso</Text></View>
              <View style={styles.statItem}><Text style={[styles.statNumber, { color: '#1B5E20' }]}>{tickets.filter(t => t.status === 'resolved').length}</Text><Text style={styles.statLabel}>Resueltos</Text></View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.ticketsCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Mis Tickets Recientes</Title>
              <Button mode="text" onPress={() => navigation.navigate('Tickets' as never)} compact>Ver todos</Button>
            </View>
            {isLoading ? <Text>Cargando tickets...</Text> : tickets.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No has creado tickets</Text>
                <Button mode="contained" onPress={() => navigation.navigate('Crear' as never)} style={styles.createButton}>Crear mi primer ticket</Button>
              </View>
            ) : (
              tickets.slice(0, 3).map((ticket) => {
                const statusColor = getStatusColor(ticket.status);
                const priorityColor = getPriorityColor(ticket.priority);
                const statusTextColor = isColorLight(statusColor) ? '#000' : '#FFF';
                const priorityTextColor = isColorLight(priorityColor) ? '#000' : '#FFF';

                return (
                  <Card key={ticket.id} style={styles.ticketCard} onPress={() => navigation.navigate('TicketDetail' as never, { ticketId: ticket.id } as never)}>
                    <Card.Content>
                      <View style={styles.ticketHeader}>
                        <Title style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Title>
                        <Chip 
                          style={[styles.statusChip, { backgroundColor: statusColor }]}
                          textStyle={[styles.chipText, { color: statusTextColor }]}
                          compact
                        >
                          {TICKET_STATUSES.find(s => s.value === ticket.status)?.label}
                        </Chip>
                      </View>
                      <Paragraph style={styles.ticketDescription} numberOfLines={2}>{ticket.description}</Paragraph>
                      <View style={styles.ticketFooter}>
                        <View style={styles.ticketInfo}><MaterialCommunityIcons name="map-marker-outline" size={14} color="#666" /><Text style={styles.ticketLocation}>{ticket.location}</Text></View>
                        <Chip 
                          style={[styles.priorityChip, { backgroundColor: priorityColor }]}
                          textStyle={[styles.chipText, { color: priorityTextColor }]}
                          compact
                        >
                          {ticket.priority.toUpperCase()}
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })
            )}
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Acciones Rápidas</Title>
            <View style={styles.actionButtons}>
              <Button mode="contained" onPress={() => navigation.navigate('Crear' as never)} style={styles.actionButton} icon="plus">Nuevo Ticket</Button>
              <Button mode="outlined" onPress={() => navigation.navigate('Tickets' as never)} style={styles.actionButton} icon="format-list-bulleted">Ver Mis Tickets</Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Información de Contacto</Title>
            <View style={styles.hospitalInfo}>
              <View style={styles.infoItem}><MaterialCommunityIcons name="map-marker-outline" size={16} color="#2E7D32" /><Text style={styles.infoText}>{HOSPITAL_INFO.address}</Text></View>
              <View style={styles.infoItem}><MaterialCommunityIcons name="phone-outline" size={16} color="#2E7D32" /><Text style={styles.infoText}>{HOSPITAL_INFO.phone}</Text></View>
              <View style={styles.infoItem}><MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" /><Text style={styles.infoText}>MINSAL</Text></View>
              <View style={styles.infoItem}><MaterialCommunityIcons name="email-outline" size={16} color="#2E7D32" /><Text style={styles.infoText}>{HOSPITAL_INFO.email}</Text></View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollView: { flex: 1 },
  welcomeCard: { margin: 16, padding: 16, backgroundColor: '#2E7D32', borderRadius: 12 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  role: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 },
  statsCard: { margin: 16, marginTop: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#2E7D32' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  ticketsCard: { margin: 16, marginTop: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16, marginBottom: 24 },
  createButton: { backgroundColor: '#2E7D32' },
  ticketCard: { marginBottom: 12, elevation: 2 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ticketTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusChip: { justifyContent: 'center', alignItems: 'center' },
  chipText: { fontSize: 10, fontWeight: 'bold' },
  ticketDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ticketLocation: { fontSize: 12, color: '#666', marginLeft: 4 },
  priorityChip: { justifyContent: 'center', alignItems: 'center' },
  actionsCard: { margin: 16, marginTop: 8 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  actionButton: { flex: 1, marginHorizontal: 8 },
  infoCard: { margin: 16, marginTop: 8, marginBottom: 80 },
  hospitalInfo: { marginTop: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#666', marginLeft: 8 },
});
