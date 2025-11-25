
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MD3LightTheme as DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Firebase
import { auth, db } from './src/firebaseConfig';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateTicketScreen from './src/screens/CreateTicketScreen';
import TicketListScreen from './src/screens/TicketListScreen';
import TicketDetailScreen from './src/screens/TicketDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';

// Types
import { User } from './src/types';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tema completo
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',
    accent: '#4CAF50', 
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    placeholder: '#757575',
    disabled: '#BDBDBD',
  },
};

function MainTabs({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'help-circle-outline';
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Tickets') iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted-type';
          else if (route.name === 'Crear') iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'account' : 'account-outline';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Inicio" options={{ title: 'Hospital Collipulli' }}>
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Tickets" options={{ title: 'Mis Tickets' }}>
        {(props) => <TicketListScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Crear" options={{ title: 'Nuevo Ticket' }}>
        {(props) => <CreateTicketScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Perfil" options={{ title: 'Mi Perfil' }}>
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let userDocListener: (() => void) | undefined;

    const authStateListener = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (userDocListener) {
        userDocListener(); // Limpiar listener anterior si existe
      }

      if (firebaseUser) {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Verificar si el documento existe por UID
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists() && firebaseUser.email) {
          // CASO DE MIGRACIÓN: El usuario logueó pero su perfil está "huérfano" con otro ID
          // Buscamos por email
          const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Encontramos el perfil huérfano! Lo migramos al UID correcto.
            const oldDoc = querySnapshot.docs[0];
            const userData = oldDoc.data();

            // 1. Crear el nuevo documento con el UID correcto
            await setDoc(userDocRef, {
              ...userData,
              id: firebaseUser.uid, // Actualizar ID
            });

            // 2. Borrar el documento antiguo (con ID aleatorio)
            await deleteDoc(oldDoc.ref);
            console.log("Perfil migrado automáticamente al UID correcto.");
          }
        }

        // Ahora sí, escuchamos el documento correcto (ya sea que existía o lo acabamos de migrar)
        userDocListener = onSnapshot(userDocRef, userDoc => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: userDoc.id,
              ...userData,
              createdAt: userData.createdAt?.toDate() ?? new Date(),
              updatedAt: userData.updatedAt?.toDate() ?? new Date(),
            } as User);
          } else {
            // Si después de todo no hay perfil, null
            setUser(null);
          }
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      authStateListener();
      if (userDocListener) {
        userDocListener();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return null; // O un componente de carga (Splash)
  }

  return (
    <PaperProvider 
        theme={theme}
        settings={{
            icon: (props) => <MaterialCommunityIcons {...props} />,
        }}
    >
      <NavigationContainer>
        <StatusBar style="light" />
        {user ? (
          <Stack.Navigator>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {(props) => <MainTabs {...props} user={user} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="TicketDetail">
                {(props) => <TicketDetailScreen {...props} user={user} />}
            </Stack.Screen>
            {user.role === 'admin' && (
              <>
                <Stack.Screen 
                  name="Admin" 
                  component={AdminScreen}
                  options={{ title: 'Administración' }}
                />
                <Stack.Screen 
                  name="AdminUsers" 
                  component={AdminUsersScreen}
                  options={{ title: 'Gestionar Usuarios' }}
                />
              </>
            )}
          </Stack.Navigator>
        ) : (
          <Stack.Navigator>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}
