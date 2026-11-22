import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const isDark = useColorScheme() === 'dark';

  const colors = {
    background: isDark ? '#121212' : '#F7F9FC',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textMain: isDark ? '#FFFFFF' : '#333333',
    border: isDark ? '#333333' : '#E0E0E0',
  };

  async function fetchExpiringItems() {
    const { data, error } = await supabase.from('pantry_items').select('*');
    if (error) {
      console.error('Error fetching items:', error.message);
      return;
    }
    if (data) {
      const nearExpiry = data.filter(item => {
        if (!item.expires_in) return false;
        if (!item.expires_in.includes('day')) return false;
        
        const match = item.expires_in.match(/\d+/);
        if (match) {
          const days = parseInt(match[0], 10);
          return days >= 1 && days <= 7; 
        }
        return false;
      });
      setItems(nearExpiry);
    }
  }

  // --- FIXED DELETE FUNCTION ---
  async function deleteItem(id: string) {
    const { error } = await supabase.from('pantry_items').delete().eq('id', id);
    if (error) {
      Alert.alert('Error', 'Could not delete item: ' + error.message);
      return;
    }
    // Refresh the dashboard list immediately
    fetchExpiringItems(); 
  }

  useFocusEffect(
    useCallback(() => {
      fetchExpiringItems();
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textMain }]}>GScan Dashboard</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textMain }]}>Alert: Expiring Soon</Text>
        
        {items.length === 0 ? (
          <Text style={{ color: colors.textMain }}>No items are expiring soon! 🎉</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.itemCard, { backgroundColor: colors.card }]}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.itemName, { color: colors.textMain }]}>{item.item_name}</Text>
                  <Text style={styles.itemDate}>Expires in: {item.expires_in}</Text>
                </View>
                
                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2A9D8F' }]} onPress={() => deleteItem(item.id)}>
                    <Text style={styles.btnText}>✅ Consumed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#E63946' },
  itemCard: { padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardInfo: { marginBottom: 15 },
  itemName: { fontSize: 18, fontWeight: 'bold' },
  itemDate: { fontSize: 14, color: '#E63946', marginTop: 5, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});