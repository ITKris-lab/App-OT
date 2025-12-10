
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../firebaseConfig';
import { OrdenCategory, OrdenActivity, User } from '../types';

// Tipos de Trabajo (Categorías)
const TIPOS_TRABAJO: { value: OrdenCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
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

// Tipos de Actividad
const TIPOS_ACTIVIDAD: { value: OrdenActivity; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'reparacion', label: 'Reparación', icon: 'wrench' },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: 'tools' },
  { value: 'mejoramiento', label: 'Mejoramiento', icon: 'trending-up' },
  { value: 'instalacion', label: 'Instalación', icon: 'plus-box-multiple' },
  { value: 'traslado', label: 'Traslado', icon: 'truck-delivery' },
  { value: 'revision', label: 'Revisión', icon: 'clipboard-check-outline' },
  { value: 'limpieza', label: 'Limpieza', icon: 'broom' },
  { value: 'reemplazo', label: 'Reemplazo', icon: 'swap-horizontal' },
  { value: 'verificacion', label: 'Verificación', icon: 'check-decagram' },
];

interface CreateOrdenScreenProps {
  user: User;
}

export default function CreateOrdenScreen({ user }: CreateOrdenScreenProps) {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<OrdenCategory>('climatizacion');
  const [activity, setActivity] = useState<OrdenActivity>('reparacion');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para subir imágenes.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `evidence/${new Date().getTime()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storage = getStorage();
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error('Error al subir la imagen');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !user) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios (*).');
      return;
    }
    setIsLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }
      await addDoc(collection(db, 'ordenes_trabajo'), {
        title: title.trim(),
        description: description.trim(),
        category, // Tipo de Trabajo
        activity, // Tipo de Actividad
        priority: 'medium',
        status: 'open',
        createdBy: user.id,
        createdByName: user.name,
        location: location.trim(),
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSnackbarVisible(true);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      console.error("Error creating orden:", error);
      Alert.alert('Error', 'No se pudo crear la orden. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.header}>
          <MaterialCommunityIcons name="plus-circle-outline" size={32} color="white" />
          <Title style={styles.headerTitle}>Nueva Orden de Trabajo</Title>
          <Paragraph style={styles.headerSubtitle}>Complete el formulario para generar una nueva OT</Paragraph>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>1. Detalles de la Solicitud</Title>
            <TextInput label="Título de la orden *" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} placeholder="Ej: Reparar aire acondicionado" left={<TextInput.Icon icon="subtitles-outline" />} />
            <TextInput label="Descripción detallada *" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={4} style={styles.input} placeholder="Describe el problema o la necesidad..." left={<TextInput.Icon icon="text-box-outline" />} />
            <TextInput label="Ubicación específica *" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} placeholder="Ej: Oficina de Partes, Box 5" left={<TextInput.Icon icon="map-marker-outline" />} />

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>2. Tipo de Trabajo</Title>
            <View style={styles.categoryGrid}>
              {TIPOS_TRABAJO.map((cat) => (
                <TouchableOpacity key={cat.value} style={[styles.categoryItem, category === cat.value && styles.categoryItemSelected]} onPress={() => setCategory(cat.value)}>
                  <MaterialCommunityIcons name={cat.icon} size={22} color={category === cat.value ? '#1976D2' : '#666'} />
                  <Text style={[styles.categoryText, category === cat.value && styles.categoryTextSelected]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>3. Tipo de Actividad</Title>
            <View style={styles.categoryGrid}>
              {TIPOS_ACTIVIDAD.map((act) => (
                <TouchableOpacity key={act.value} style={[styles.categoryItem, activity === act.value && styles.categoryItemSelected]} onPress={() => setActivity(act.value)}>
                  <MaterialCommunityIcons name={act.icon} size={22} color={activity === act.value ? '#1976D2' : '#666'} />
                  <Text style={[styles.categoryText, activity === act.value && styles.categoryTextSelected]}>{act.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>4. Evidencia (Opcional)</Title>
            <View style={styles.evidenceContainer}>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                    <MaterialCommunityIcons name="close-circle" size={24} color="#C62828" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Button mode="outlined" onPress={handlePickImage} icon="camera" style={styles.uploadButton}>
                  Adjuntar Foto
                </Button>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !title.trim() || !description.trim() || !location.trim()}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Creando...' : 'Crear Orden'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={{ backgroundColor: '#1976D2', marginBottom: 20 }}
        action={{
          label: 'OK',
          onPress: () => navigation.goBack(),
        }}>
        Orden creada exitosamente
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#1976D2', padding: 20, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginTop: 4 },
  card: { margin: 16, marginTop: -40, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976D2', marginBottom: 16, marginTop: 8 },
  input: { marginBottom: 16 },
  divider: { marginVertical: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 10 },
  categoryItem: { width: '30%', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F8F9FA' },
  categoryItemSelected: { borderColor: '#1976D2', backgroundColor: 'rgba(25, 118, 210, 0.1)' },
  categoryText: { fontSize: 11, textAlign: 'center', marginTop: 6, color: '#666', fontWeight: '500' },
  categoryTextSelected: { color: '#1976D2', fontWeight: 'bold' },
  submitButton: { marginTop: 24, backgroundColor: '#1976D2' },
  buttonContent: { paddingVertical: 8 },
  evidenceContainer: { alignItems: 'center', marginVertical: 8 },
  uploadButton: { width: '100%' },
  imagePreviewContainer: { position: 'relative', width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 12 },
});
