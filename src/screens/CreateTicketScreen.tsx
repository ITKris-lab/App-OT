
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Text,
  Surface,
  Divider,
  Snackbar,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TicketCategory, User } from '../types';

// Categorías con íconos de MaterialCommunityIcons
const TICKET_CATEGORIES: { value: TicketCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'hardware', label: 'Hardware', icon: 'memory' },
  { value: 'software', label: 'Software', icon: 'apps' },
  { value: 'network', label: 'Redes', icon: 'wifi' },
  { value: 'printer', label: 'Impresoras', icon: 'printer-outline' },
  { value: 'user_support', label: 'Soporte Usuario', icon: 'account-circle-outline' },
  { value: 'other', label: 'Otro', icon: 'help-circle-outline' },
];

interface CreateTicketScreenProps {
  user: User;
}

export default function CreateTicketScreen({ user }: CreateTicketScreenProps) {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('hardware');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !user) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios (*).');
      return;
    }

    setIsLoading(true);

    try {
      await addDoc(collection(db, 'tickets'), {
        title: title.trim(),
        description: description.trim(),
        category,
        priority: 'medium', // Prioridad por defecto
        status: 'open',
        createdBy: user.id,
        createdByName: user.name,
        location: location.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Mostrar notificación visual y esperar antes de salir
      setSnackbarVisible(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error) {
      console.error("Error creating ticket:", error);
      Alert.alert('Error', 'No se pudo crear el ticket. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.header}>
          <MaterialCommunityIcons name="plus-circle-outline" size={32} color="white" />
          <Title style={styles.headerTitle}>Nuevo Ticket</Title>
          <Paragraph style={styles.headerSubtitle}>Reporta un problema o solicita un servicio</Paragraph>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Información Básica</Title>
            <TextInput label="Título del ticket *" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} placeholder="Ej: PC no enciende" left={<TextInput.Icon icon="subtitles-outline" />} />
            <TextInput label="Descripción detallada *" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={4} style={styles.input} placeholder="Describe el problema y dónde ocurre..." left={<TextInput.Icon icon="text-box-outline" />} />

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>Categoría</Title>
            <View style={styles.categoryGrid}>
              {TICKET_CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.value} style={[styles.categoryItem, category === cat.value && styles.categoryItemSelected]} onPress={() => setCategory(cat.value)}>
                  <MaterialCommunityIcons name={cat.icon} size={22} color={category === cat.value ? '#2E7D32' : '#666'} />
                  <Text style={[styles.categoryText, category === cat.value && styles.categoryTextSelected]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>Información Adicional</Title>
            <TextInput label="Ubicación específica *" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} placeholder="Ej: Oficina de Partes, Box 5" left={<TextInput.Icon icon="map-marker-outline" />} />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !title.trim() || !description.trim() || !location.trim()}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Creando...' : 'Crear Ticket'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={{ backgroundColor: '#2E7D32', marginBottom: 20 }}
        action={{
          label: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        }}>
        Ticket creado exitosamente
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#2E7D32', padding: 20, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginTop: 4 },
  card: { margin: 16, marginTop: -40, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginBottom: 16, marginTop: 8 },
  input: { marginBottom: 16 },
  divider: { marginVertical: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 8 },
  categoryItem: { width: '45%', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F8F9FA' },
  categoryItemSelected: { borderColor: '#2E7D32', backgroundColor: 'rgba(46, 125, 50, 0.1)' },
  categoryText: { fontSize: 12, textAlign: 'center', marginTop: 6, color: '#666' },
  categoryTextSelected: { color: '#2E7D32', fontWeight: 'bold' },
  submitButton: { marginTop: 16, backgroundColor: '#2E7D32' },
  buttonContent: { paddingVertical: 8 },
});
