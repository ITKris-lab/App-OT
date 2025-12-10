
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
import { Orden, User, OrdenCategory } from '../types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Constantes
const ORDEN_CATEGORIES: { value: OrdenCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'climatizacion', label: 'Climatización', icon: 'air-conditioner' },
  { value: 'electrica', label: 'Eléctrica', icon: 'lightning-bolt' },
  { value: 'mecanica', label: 'Mecánica', icon: 'cog' },
  { value: 'electronica', label: 'Electrónica', icon: 'chip' },
  { value: 'operacion', label: 'Operación', icon: 'dolly' },
  { value: 'fontaneria', label: 'Fontanería', icon: 'water-pump' },
  { value: 'albanileria', label: 'Albañilería', icon: 'wall' },
  { value: 'pintura', label: 'Pintura', icon: 'format-paint' },
  { value: 'carpinteria', label: 'Carpintería', icon: 'hand-saw' },
];

export default function AdminScreen() {
  const navigation = useNavigation();
  const [allOrdenes, setAllOrdenes] = useState<Orden[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ordenesQuery = query(collection(db, 'ordenes_trabajo'), orderBy('createdAt', 'desc'));
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubOrdenes = onSnapshot(ordenesQuery, snapshot => {
      const ordenesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() ?? new Date() } as Orden));
      setAllOrdenes(ordenesData);
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

    return () => { unsubOrdenes(); unsubUsers(); };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
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
              <Ionicons name="people-circle-outline" size={64} color="#1976D2" />
              <Title style={{ marginTop: 16 }}>Gestión de Usuarios</Title>
              <Paragraph style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
                Administrar cuentas, roles y sectores del personal.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('AdminUsers' as never)} 
                style={{ backgroundColor: '#1976D2', width: '100%' }}
                icon="account-cog"
              >
                Ir a Gestión de Usuarios
              </Button>
            </Card.Content>
          </Card>

          {/* Tarjeta de Reportes */}
          <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#1B5E20' }]}>
            <Card.Content style={{ alignItems: 'center', padding: 20 }}>
              <MaterialCommunityIcons name="chart-bar" size={64} color="#1B5E20" />
              <Title style={{ marginTop: 16 }}>Reportes y Estadísticas</Title>
              <Paragraph style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
                Ver gráficos, métricas y descargar historial.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Reports' as never)} 
                style={{ backgroundColor: '#1B5E20', width: '100%' }}
                icon="file-chart"
              >
                Ver Reportes
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
                    <Title style={styles.statNumber}>{allOrdenes.length}</Title>
                    <Paragraph style={styles.statLabel}>Órdenes Totales</Paragraph>
                </Card.Content>
             </Card>
             <Card style={[styles.card, styles.statCard]}>
                <Card.Content style={{ alignItems: 'center' }}>
                    <Title style={[styles.statNumber, {color: '#F44336'}]}>
                        {allOrdenes.filter(t => t.status === 'open').length}
                    </Title>
                    <Paragraph style={styles.statLabel}>Abiertas</Paragraph>
                </Card.Content>
             </Card>
          </View>

          {/* Resumen de Ordenes por Categoría */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Órdenes por Categoría</Title>
              {ORDEN_CATEGORIES.map(category => {
                const count = allOrdenes.filter(t => t.category === category.value).length;
                if (count === 0) return null;
                return (
                  <View key={category.value} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <MaterialCommunityIcons name={category.icon as any} size={20} color="#666" />
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1976D2' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  card: { marginBottom: 16, elevation: 2, backgroundColor: 'white' },
  mainActionCard: { borderLeftWidth: 4, borderLeftColor: '#1976D2' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976D2', marginBottom: 16 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoryInfo: { flexDirection: 'row', alignItems: 'center' },
  categoryLabel: { fontSize: 14, color: '#333', marginLeft: 12 },
  categoryCount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
});
