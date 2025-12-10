
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Searchbar,
  Surface,
  Text,
  Menu,
  Button,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Orden, User, OrdenStatus, OrdenCategory } from '../types';

// Constantes con íconos de MaterialCommunityIcons
const ORDEN_CATEGORIES: { value: OrdenCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'hardware', label: 'Hardware', icon: 'memory' },
  { value: 'software', label: 'Software', icon: 'apps' },
  { value: 'network', label: 'Redes', icon: 'wifi' },
  { value: 'printer', label: 'Impresoras', icon: 'printer-outline' },
  { value: 'user_support', label: 'Soporte Usuario', icon: 'account-circle-outline' },
  { value: 'other', label: 'Otro', icon: 'help-circle-outline' },
];

const ORDEN_STATUSES: { value: OrdenStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Abierto', color: '#2196F3' },
  { value: 'in_progress', label: 'En Progreso', color: '#FF9800' },
  { value: 'pending', label: 'Pendiente', color: '#9C27B0' },
  { value: 'resolved', label: 'Resuelto', color: '#1B5E20' },
  { value: 'closed', label: 'Cerrado', color: '#607D8B' },
];

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

interface OrdenListScreenProps {
  user: User;
}

export default function OrdenListScreen({ user }: OrdenListScreenProps) {
  const navigation = useNavigation();
  const [allOrdenes, setAllOrdenes] = useState<Orden[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<Orden[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrdenStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    
    let ordenesQuery = query(collection(db, 'ordenes_trabajo'), orderBy('createdAt', 'desc'));

    if (selectedStatus !== 'all') {
      ordenesQuery = query(ordenesQuery, where('status', '==', selectedStatus));
    }

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
        } as Orden;
      });
      setAllOrdenes(ordenesData);
      setIsLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Error fetching ordenes: ", error);
      Alert.alert('Error', 'No se pudo cargar la lista de órdenes.');
      setIsLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user, selectedStatus]);

  useEffect(() => {
    let filtered = allOrdenes;
    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = allOrdenes.filter(orden =>
        orden.title.toLowerCase().includes(lowercasedQuery) ||
        orden.description.toLowerCase().includes(lowercasedQuery)
      );
    }
    setFilteredOrdenes(filtered);
  }, [searchQuery, allOrdenes]);

  const onRefresh = () => setRefreshing(true);

  const getStatusColor = (status: OrdenStatus) => ORDEN_STATUSES.find(s => s.value === status)?.color || '#666';
  const getCategoryIcon = (category: string) => ORDEN_CATEGORIES.find(c => c.value === category)?.icon || 'help-circle-outline';

  const formatDate = (date: Date) => {
    if (!date) return 'Fecha inválida';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return 'Hace unos minutos';
  };

  const renderOrden = ({ item }: { item: Orden }) => {
    const statusColor = getStatusColor(item.status);
    const statusTextColor = isColorLight(statusColor) ? '#000' : '#FFF';

    return (
      <TouchableOpacity onPress={() => navigation.navigate('TicketDetail' as never, { ticketId: item.id } as never)}>
        <Card style={styles.ticketCard}>
          <Card.Content>
            <View style={styles.ticketHeader}>
              <View style={styles.ticketTitleContainer}>
                <Title style={styles.ticketTitle} numberOfLines={1}>{item.title}</Title>
                <View style={styles.ticketMeta}>
                  <MaterialCommunityIcons name={getCategoryIcon(item.category)} size={16} color="#666" />
                  <Text style={styles.ticketCategory}>{ORDEN_CATEGORIES.find(c => c.value === item.category)?.label}</Text>
                </View>
              </View>
              <Chip 
                style={[styles.statusChip, { backgroundColor: statusColor }]}
                textStyle={[styles.chipText, { color: statusTextColor }]}
                compact
              >
                {ORDEN_STATUSES.find(s => s.value === item.status)?.label}
              </Chip>
            </View>
            <Paragraph style={styles.ticketDescription} numberOfLines={2}>{item.description}</Paragraph>
            <View style={styles.ticketFooter}>
              <View style={styles.ticketInfo}><MaterialCommunityIcons name="map-marker-outline" size={14} color="#666" /><Text style={styles.ticketLocation}>{item.location}</Text></View>
              <View style={styles.ticketInfo}><MaterialCommunityIcons name="clock-time-three-outline" size={14} color="#666" /><Text style={styles.ticketTime}>{formatDate(item.createdAt)}</Text></View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }

  const renderEmptyState = () => (
    !isLoading && (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={64} color="#ccc" />
        <Title style={styles.emptyTitle}>No hay órdenes</Title>
        <Paragraph style={styles.emptyText}>
          {searchQuery || selectedStatus !== 'all' ? 'No se encontraron órdenes con los filtros aplicados' : 'Aún no se han creado órdenes'}
        </Paragraph>
      </View>
    )
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Searchbar placeholder="Buscar órdenes..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchbar} elevation={Platform.OS === 'android' ? 2 : 0} />
        <View style={styles.filterContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<Button mode="outlined" onPress={() => setMenuVisible(true)} style={styles.filterButton} icon="filter-variant">{selectedStatus === 'all' ? 'Todos' : ORDEN_STATUSES.find(s => s.value === selectedStatus)?.label}</Button>}
          >
            <Menu.Item onPress={() => { setSelectedStatus('all'); setMenuVisible(false); }} title="Todos" />
            {ORDEN_STATUSES.map((status) => (
              <Menu.Item key={status.value} onPress={() => { setSelectedStatus(status.value); setMenuVisible(false); }} title={status.label} />
            ))}
          </Menu>
        </View>
      </Surface>

      <FlatList
        data={filteredOrdenes}
        renderItem={renderOrden}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  searchbar: { marginBottom: 12 },
  filterContainer: { flexDirection: 'row', justifyContent: 'flex-end' },
  filterButton: { borderColor: '#1976D2' },
  listContainer: { flexGrow: 1, padding: 16, paddingBottom: 80 },
  ticketCard: { marginBottom: 12, elevation: 2 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ticketTitleContainer: { flex: 1, marginRight: 8 },
  ticketTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center' },
  ticketCategory: { fontSize: 12, color: '#666', marginLeft: 4 },
  statusChip: { justifyContent: 'center', alignItems: 'center' },
  chipText: { fontSize: 10, fontWeight: 'bold' },
  ticketDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketInfo: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 8 },
  ticketLocation: { fontSize: 12, color: '#666', marginLeft: 4, flexShrink: 1 },
  ticketTime: { fontSize: 12, color: '#666', marginLeft: 4 },
  emptyState: { alignItems: 'center', paddingTop: '30%' },
  emptyTitle: { fontSize: 20, color: '#666', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginBottom: 24 },
});
