import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

export default function ProfileScreen() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [userEmail, setUserEmail] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

  const isDark = useColorScheme() === 'dark';
  const colors = {
    background: isDark ? '#121212' : '#F7F9FC',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textMain: isDark ? '#FFFFFF' : '#333333',
    border: isDark ? '#333333' : '#E0E0E0',
    inputBg: isDark ? '#2A2A2A' : '#F0F0F0',
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (session) fetchUserDataAndStats();
    }, [session])
  );

  async function fetchUserDataAndStats() {
    setUserEmail(session?.user?.email || 'User');
    
    const { data } = await supabase.from('pantry_items').select('*');
    if (data) {
      setTotalItems(data.length);
      const nearExpiry = data.filter(item => {
        if (!item.expires_in || !item.expires_in.includes('day')) return false;
        const match = item.expires_in.match(/\d+/);
        if (match) {
          const days = parseInt(match[0], 10);
          return days >= 1 && days <= 7;
        }
        return false;
      });
      setExpiringCount(nearExpiry.length);
    }
  }

  // --- AUTHENTICATION FUNCTIONS ---
  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login Failed', error.message);
  }

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Signup Failed', error.message);
    else Alert.alert('Success', 'Check your email for the confirmation link or log in now!');
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  }

  // NEW: Forgot Password Function
  async function handleResetPassword() {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address in the box first so we know where to send the link.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email for a password reset link!');
    }
  }

  // --- UI: SIGNED OUT STATE ---
  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authContainer}>
          <Text style={[styles.authTitle, { color: colors.textMain }]}>Welcome to GScan</Text>
          <Text style={[styles.authSubtitle, { color: colors.textMain }]}>by Vetora</Text>
          <Text style={[styles.authSubtitle, { color: colors.textMain }]}>Sign in to sync your pantry</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border, marginBottom: 10 }]}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          {/* NEW: Forgot Password Button */}
          <TouchableOpacity onPress={handleResetPassword} style={styles.forgotPassBtn}>
            <Text style={styles.forgotPassText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.authBtn, { backgroundColor: '#2A9D8F' }]} onPress={handleSignIn}>
            <Text style={styles.authBtnText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.authBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2A9D8F' }]} onPress={handleSignUp}>
            <Text style={[styles.authBtnText, { color: '#2A9D8F' }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- UI: SIGNED IN STATE (DASHBOARD) ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textMain }]}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.textMain }]}>Logged in as:</Text>
          <Text style={[styles.emailText, { color: colors.textMain }]}>{userEmail}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={styles.statNumber}>{totalItems}</Text>
            <Text style={[styles.statLabel, { color: colors.textMain }]}>Total Items</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: '#E76F51' }]}>{expiringCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMain }]}>Expiring Soon</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  card: { padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  label: { fontSize: 14, color: '#888', marginBottom: 5 },
  emailText: { fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 5, elevation: 2 },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#2A9D8F', marginBottom: 5 },
  statLabel: { fontSize: 14, fontWeight: '600' },
  signOutBtn: { backgroundColor: '#E63946', padding: 15, borderRadius: 12, alignItems: 'center' },
  signOutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  // Auth Styles
  authContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  authTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  authSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  forgotPassBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotPassText: { color: '#2A9D8F', fontWeight: '600' },
  authBtn: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  authBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});