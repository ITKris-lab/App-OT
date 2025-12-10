
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Surface,
  ProgressBar,
  List,
} from 'react-native-paper';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Orden } from '../types';

// Importación condicional o segura para evitar errores en Web
let FileSystem: any;
let Sharing: any;

if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
    Sharing = require('expo-sharing');
  } catch (e) {
    console.warn("Librerías nativas no encontradas");
  }
}

export default function ReportsScreen() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    open: 0,
    inProgress: 0,
    other: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'ordenes_trabajo'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate(),
          updatedAt: d.updatedAt?.toDate(),
          resolvedAt: d.resolvedAt?.toDate(),
        } as Orden;
      });

      setOrdenes(data);
      calculateStats(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Orden[]) => {
    const total = data.length;
    const resolved = data.filter(o => o.status === 'resolved' || o.status === 'closed').length;
    const open = data.filter(o => o.status === 'open' || o.status === 'pending').length;
    const inProgress = data.filter(o => o.status === 'in_progress').length;

    setStats({
      total,
      resolved,
      open,
      inProgress,
      other: total - (resolved + open + inProgress),
    });
  };

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return value / stats.total;
  };

  const generateCSV = () => {
    // Encabezados del Excel
    let csvContent = "ID,Fecha Creacion,Titulo,Categoria,Actividad,Estado,Creado Por,Ubicacion,Fecha Resolucion\n";

    ordenes.forEach(orden => {
      // Formatear fechas y evitar nulos
      const created = orden.createdAt ? orden.createdAt.toLocaleDateString('es-CL') : '';
      const resolved = orden.resolvedAt ? orden.resolvedAt.toLocaleDateString('es-CL') : '';
      
      // Limpiar comas en textos para no romper el CSV
      const clean = (text: string) => text ? text.replace(/,/g, ' ').replace(/\n/g, ' ') : '';

      const row = [
        orden.id,
        created,
        clean(orden.title),
        orden.category,
        orden.activity || '',
        orden.status,
        clean(orden.createdByName),
        clean(orden.location || ''),
        resolved
      ].join(',');

      csvContent += row + "\n";
    });

    return csvContent;
  };

  const handleExport = async () => {
    const csvData = generateCSV();

    if (Platform.OS === 'web') {
      // Descarga directa en navegador (API nativa del navegador)
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `reporte_ot_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Móvil: Guardar y Compartir usando las librerías nativas
      if (FileSystem && Sharing) {
        try {
          const fileUri = FileSystem.documentDirectory + 'reporte_ot.csv';
          await FileSystem.writeAsStringAsync(fileUri, csvData, { encoding: FileSystem.EncodingType.UTF8 });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          } else {
            Alert.alert('Info', 'Compartir no está disponible en este dispositivo');
          }
        } catch (error) {
          console.error(error);
          Alert.alert('Error', 'No se pudo generar el archivo');
        }
      } else {
        Alert.alert('Error', 'Librerías de sistema de archivos no disponibles');
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header}>
        <Title style={styles.headerTitle}>Reportes y Estadísticas</Title>
        <Paragraph style={{color:'white'}}>Resumen global de órdenes</Paragraph>
      </Surface>

      <View style={styles.content}>
        {/* Tarjeta de Exportación */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Exportar Datos</Title>
            <Paragraph style={{marginBottom: 16, color: '#666'}}>
              Descarga todas las órdenes en formato CSV compatible con Excel.
            </Paragraph>
            <Button 
              mode="contained" 
              icon="microsoft-excel" 
              onPress={handleExport}
              style={{backgroundColor: '#1B5E20'}}
              loading={loading}
              disabled={loading}
            >
              Descargar Reporte Excel
            </Button>
          </Card.Content>
        </Card>

        {/* Tarjeta de Estadísticas Visuales */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Estado de Órdenes</Title>
            <Text style={styles.totalText}>Total de Órdenes: {stats.total}</Text>

            {/* Resueltas */}
            <View style={styles.statRow}>
              <View style={styles.statLabelRow}>
                <Text>Resueltas</Text>
                <Text style={{fontWeight:'bold'}}>{Math.round(getPercentage(stats.resolved)*100)}% ({stats.resolved})</Text>
              </View>
              <ProgressBar progress={getPercentage(stats.resolved)} color="#1B5E20" style={styles.progress} />
            </View>

            {/* En Progreso */}
            <View style={styles.statRow}>
              <View style={styles.statLabelRow}>
                <Text>En Progreso</Text>
                <Text style={{fontWeight:'bold'}}>{Math.round(getPercentage(stats.inProgress)*100)}% ({stats.inProgress})</Text>
              </View>
              <ProgressBar progress={getPercentage(stats.inProgress)} color="#FF9800" style={styles.progress} />
            </View>

            {/* Pendientes/Abiertas */}
            <View style={styles.statRow}>
              <View style={styles.statLabelRow}>
                <Text>Pendientes / Abiertas</Text>
                <Text style={{fontWeight:'bold'}}>{Math.round(getPercentage(stats.open)*100)}% ({stats.open})</Text>
              </View>
              <ProgressBar progress={getPercentage(stats.open)} color="#2196F3" style={styles.progress} />
            </View>

          </Card.Content>
        </Card>

        {/* Información Técnica */}
        <Card style={styles.card}>
            <Card.Content>
                <Title style={styles.cardTitle}>Datos Técnicos</Title>
                <List.Item
                    title="ID de Proyecto"
                    description="AppOT-Firebase"
                    left={props => <List.Icon {...props} icon="identifier" />}
                />
                 <List.Item
                    title="Registros Totales"
                    description={`${stats.total} registros en base de datos`}
                    left={props => <List.Icon {...props} icon="database" />}
                />
            </Card.Content>
        </Card>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#1976D2', padding: 20, elevation: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  content: { padding: 16 },
  card: { marginBottom: 16, elevation: 2, backgroundColor: 'white' },
  cardTitle: { color: '#1976D2', fontWeight: 'bold', marginBottom: 8 },
  totalText: { fontSize: 16, marginBottom: 16, fontWeight: 'bold' },
  statRow: { marginBottom: 16 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progress: { height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' },
});
