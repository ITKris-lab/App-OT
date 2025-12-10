
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Text,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Información del Hospital actualizada
const HOSPITAL_INFO = {
  name: 'Hospital de Collipulli',
  address: 'Av. Manuel Rodriguez 1671, Collipulli, Chile',
  phone: '+56 9 82573375',
  email: 'tic.kym24@gmail.com',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthentication = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let errorMessage = 'Ocurrió un error.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          errorMessage = 'Correo o contraseña incorrectos.';
          break;
        default:
          errorMessage = 'Revisa tus credenciales o intenta más tarde.';
          console.log(error.code);
      }
      Alert.alert('Error de autenticación', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="tools" size={60} color="#1976D2" />
          <Title style={styles.title}>{HOSPITAL_INFO.name}</Title>
          <Paragraph style={styles.subtitle}>
            Sistema Ordenes de Trabajo
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Acceso al Sistema</Title>
            
            <TextInput
              label="Correo electrónico *"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Contraseña *"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword} // Depende del estado
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)} 
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleAuthentication}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Iniciando...' : 'Acceder'}
            </Button>

          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {HOSPITAL_INFO.address}
          </Text>
          <Text style={styles.footerText}>
            Tel: {HOSPITAL_INFO.phone}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1976D2', textAlign: 'center', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 5 },
  card: { elevation: 4, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1976D2' },
  input: { marginBottom: 15 },
  loginButton: { marginTop: 20, backgroundColor: '#1976D2' },
  buttonContent: { paddingVertical: 8 },
  toggleText: { marginTop: 20, textAlign: 'center', color: '#1976D2', fontWeight: 'bold' },
  footer: { alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 5 },
});
