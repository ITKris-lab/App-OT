
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
import { Orden, User, OrdenStatus } from '../types';

// Constantes
const ORDEN_STATUSES: { value: OrdenStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Abierto', color: '#2196F3' },
  { value: 'in_progress', label: 'En Progreso', color: '#FF9800' },
  { value: 'pending', label: 'Pendiente', color: '#9C27B0' },
  { value: 'resolved', label: 'Resuelto', color: '#1B5E20' },
  { value: 'closed', label: 'Cerrado', color: '#607D8B' },
];

const HOSPITAL_INFO = {
  name: 'Hospital de Collipulli',
  address: 'Av. Manuel Rodriguez 1671, Collipulli, Chile',
  phone: '+56 9 82573375',
  email: 'tic.kym24@gmail.com',
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
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    let ordenesQuery = query(collection(db, 'ordenes_trabajo'), orderBy('createdAt', 'desc'), limit(10));

    if (user.role !== 'admin') {
      ordenesQuery = query(ordenesQuery, where('createdBy', '==', user.id));
    }

    const unsubscribe = onSnapshot(ordenesQuery, (snapshot) => {
      const ordenesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          resolvedAt: data.resolvedAt?.toDate(),
        } as Orden;
      });
      setOrdenes(ordenesData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: Orden['status']) => ORDEN_STATUSES.find(s => s.value === status)?.color || '#666';

  const getPriorityColor = (priority: Orden['priority']) => {
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
            <Title style={styles.cardTitle}>Resumen de Mis Órdenes</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statNumber}>{ordenes.length}</Text><Text style={styles.statLabel}>Total</Text></View>
              <View style={styles.statItem}><Text style={[styles.statNumber, { color: '#2196F3' }]}>{ordenes.filter(t => t.status === 'open').length}</Text><Text style={styles.statLabel}>Abiertos</Text></View>
              <View style={styles.statItem}><Text style={[styles.statNumber, { color: '#FF9800' }]}>{ordenes.filter(t => t.status === 'in_progress').length}</Text><Text style={styles.statLabel}>En Progreso</Text></View>
              <View style={styles.statItem}><Text style={[styles.statNumber, { color: '#1B5E20' }]}>{ordenes.filter(t => t.status === 'resolved').length}</Text><Text style={styles.statLabel}>Resueltos</Text></View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.ticketsCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Mis Órdenes Recientes</Title>
              <Button mode="text" onPress={() => navigation.navigate('Tickets' as never)} compact>Ver todas</Button>
            </View>
            {isLoading ? <Text>Cargando órdenes...</Text> : ordenes.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No has creado órdenes</Text>
                <Button mode="contained" onPress={() => navigation.navigate('Crear' as never)} style={styles.createButton}>Crear mi primera orden</Button>
              </View>
            ) : (
              ordenes.slice(0, 3).map((orden) => {
                const statusColor = getStatusColor(orden.status);
                const priorityColor = getPriorityColor(orden.priority);
                const statusTextColor = isColorLight(statusColor) ? '#000' : '#FFF';
                const priorityTextColor = isColorLight(priorityColor) ? '#000' : '#FFF';

                return (
                  <Card key={orden.id} style={styles.ticketCard} onPress={() => navigation.navigate('TicketDetail' as never, { ticketId: orden.id } as never)}>
                    <Card.Content>
                      <View style={styles.ticketHeader}>
                        <Title style={styles.ticketTitle} numberOfLines={1}>{orden.title}</Title>
                        <Chip 
                          style={[styles.statusChip, { backgroundColor: statusColor }]}
                          textStyle={[styles.chipText, { color: statusTextColor }]}
                          compact
                        >
                          {ORDEN_STATUSES.find(s => s.value === orden.status)?.label}
                        </Chip>
                      </View>
                      <Paragraph style={styles.ticketDescription} numberOfLines={2}>{orden.description}</Paragraph>
                      <View style={styles.ticketFooter}>
                        <View style={styles.ticketInfo}><MaterialCommunityIcons name="map-marker-outline" size={14} color="#666" /><Text style={styles.ticketLocation}>{orden.location}</Text></View>
                        <Chip 
                          style={[styles.priorityChip, { backgroundColor: priorityColor }]}
                          textStyle={[styles.chipText, { color: priorityTextColor }]}
                          compact
                        >
                          {orden.priority.toUpperCase()}
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
              <Button mode="contained" onPress={() => navigation.navigate('Crear' as never)} style={styles.actionButton} icon="plus">Nueva Orden</Button>
              <Button mode="outlined" onPress={() => navigation.navigate('Tickets' as never)} style={styles.actionButton} icon="format-list-bulleted">Ver Mis Órdenes</Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Información de Contacto</Title>
            <View style={styles.hospitalInfo}>
              <View style={styles.infoItem}><MaterialCommunityIcons name="map-marker-outline" size={16} color="#1976D2" /><Text style={styles.infoText}>{HOSPITAL_INFO.address}</Text></View>
              <View style={styles.infoItem}><MaterialCommunityIcons name="phone-outline" size={16} color="#1976D2" /><Text style={styles.infoText}>{HOSPITAL_INFO.phone}</Text></View>
              <View style={styles.infoItem}><MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" /><Text style={styles.infoText}>MINSAL</Text></View>
              <View style={styles.infoItem}><MaterialCommunityIcons name="email-outline" size={16} color="#1976D2" /><Text style={styles.infoText}>{HOSPITAL_INFO.email}</Text></View>
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
  welcomeCard: { margin: 16, padding: 16, backgroundColor: '#1976D2', borderRadius: 12 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  role: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 },
  statsCard: { margin: 16, marginTop: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1976D2' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  ticketsCard: { margin: 16, marginTop: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16, marginBottom: 24 },
  createButton: { backgroundColor: '#1976D2' },
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
