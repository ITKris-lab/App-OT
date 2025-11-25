
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Searchbar,
  Portal,
  Modal,
  TextInput,
  RadioButton,
  Surface,
  IconButton,
  Chip,
} from 'react-native-paper';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from '../types';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados para el formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sector, setSector] = useState('');
  const [role, setRole] = useState<'admin' | 'patient'>('patient');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate() ?? new Date(),
      } as User));
      setUsers(usersData);
      setFilteredUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(lower) || 
        u.email.toLowerCase().includes(lower) ||
        u.sector?.toLowerCase().includes(lower)
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const openCreateModal = () => {
    setIsCreating(true);
    setCurrentUser(null);
    setName('');
    setEmail('');
    setSector('');
    setRole('patient');
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setIsCreating(false);
    setCurrentUser(user);
    setName(user.name);
    setEmail(user.email); // Solo lectura en edición
    setSector(user.sector || '');
    setRole(user.role);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentUser(null);
    setName('');
    setEmail('');
    setSector('');
    setRole('patient');
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !sector.trim()) {
      Alert.alert('Error', 'Nombre y Sector son obligatorios');
      return;
    }

    if (isCreating && !email.trim()) {
      Alert.alert('Error', 'El correo electrónico es obligatorio para nuevos usuarios');
      return;
    }

    setLoading(true);
    try {
      if (isCreating) {
        const newUserRef = doc(collection(db, 'users'));
        await setDoc(newUserRef, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          sector: sector.trim(),
          role: role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        Alert.alert(
          'Perfil Creado', 
          'El perfil del usuario se ha guardado en la base de datos.\n\nIMPORTANTE: Debes crear la cuenta de acceso (Email/Password) manualmente en la consola de Firebase Authentication para que pueda ingresar.'
        );

      } else if (currentUser && currentUser.id) {
        await updateDoc(doc(db, 'users', currentUser.id), {
          name: name.trim(),
          sector: sector.trim(),
          role: role,
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      }
      
      closeModal();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user: User) => {
    const confirmMessage = "¿Estás seguro de eliminar a este usuario? Perderá su perfil en la aplicación.";
    
    const deleteAction = async () => {
      try {
        await deleteDoc(doc(db, 'users', user.id));
      } catch (error) {
        Alert.alert('Error', 'No se pudo eliminar el usuario');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) deleteAction();
    } else {
      Alert.alert('Eliminar Usuario', confirmMessage, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: deleteAction }
      ]);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.userInfo}>
          <Title style={styles.userName}>{item.name}</Title>
          <Paragraph style={styles.userEmail}>{item.email}</Paragraph>
          <View style={styles.chipsContainer}>
            <Chip icon="briefcase-outline" compact style={styles.chip}>{item.sector}</Chip>
            <Chip 
              icon={item.role === 'admin' ? 'shield-check' : 'account'} 
              compact 
              style={[styles.chip, { backgroundColor: item.role === 'admin' ? '#E8F5E9' : '#E3F2FD' }]}
              textStyle={{ color: item.role === 'admin' ? '#1B5E20' : '#1565C0' }}
            >
              {item.role === 'admin' ? 'Administrador' : 'Usuario Básico'}
            </Chip>
          </View>
        </View>
        <View style={styles.actions}>
          <IconButton icon="pencil" mode="contained" containerColor="#F5F5F5" iconColor="#2E7D32" size={20} onPress={() => openEditModal(item)} />
          <IconButton icon="trash-can-outline" mode="contained" containerColor="#FFEBEE" iconColor="#C62828" size={20} onPress={() => handleDelete(item)} />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Searchbar
          placeholder="Buscar usuarios..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          elevation={1}
        />
      </Surface>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
             <Text style={{ color: '#666' }}>No se encontraron usuarios</Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="Nuevo Usuario"
        onPress={openCreateModal}
      />

      <Portal>
        <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
          <Title style={styles.modalTitle}>{isCreating ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</Title>
          <ScrollView>
            <TextInput
              label="Nombre Completo"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Correo Electrónico"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={!isCreating} // No se puede editar el email una vez creado
            />
            <TextInput
              label="Sector / Servicio"
              value={sector}
              onChangeText={setSector}
              mode="outlined"
              style={styles.input}
            />
            
            <Text style={styles.label}>Rol del Usuario:</Text>
            <RadioButton.Group onValueChange={val => setRole(val as 'admin' | 'patient')} value={role}>
              <View style={styles.radioRow}>
                <RadioButton value="patient" color="#2E7D32" />
                <Text>Usuario Básico</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="admin" color="#2E7D32" />
                <Text style={{ fontWeight: 'bold' }}>Administrador</Text>
              </View>
            </RadioButton.Group>

            <View style={styles.modalActions}>
              <Button onPress={closeModal} textColor="#666">Cancelar</Button>
              <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveButton}>Guardar</Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 16, backgroundColor: 'white', elevation: 2 },
  searchbar: { backgroundColor: '#F5F5F5' },
  listContent: { padding: 16, paddingBottom: 80 }, // Espacio para el FAB
  card: { marginBottom: 12, backgroundColor: 'white' },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 8 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 26 },
  actions: { flexDirection: 'column', gap: 4 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#2E7D32' },
  modalContainer: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
  modalTitle: { marginBottom: 16, color: '#2E7D32', textAlign: 'center' },
  input: { marginBottom: 12 },
  label: { fontSize: 16, marginTop: 8, marginBottom: 8, fontWeight: 'bold' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  saveButton: { backgroundColor: '#2E7D32' },
});
