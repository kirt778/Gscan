import { GoogleGenerativeAI } from '@google/generative-ai';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

export default function InventoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [isGridView, setIsGridView] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [expiryNumber, setExpiryNumber] = useState(''); 
  const [expiryUnit, setExpiryUnit] = useState('days'); 
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  const isDark = useColorScheme() === 'dark';
  const colors = {
    background: isDark ? '#121212' : '#F7F9FC',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textMain: isDark ? '#FFFFFF' : '#333333',
    inputBg: isDark ? '#2A2A2A' : '#F0F0F0',
    borderColor: isDark ? '#444444' : '#CCCCCC',
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

  // Automatically refresh inventory list whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  async function fetchItems() {
    const { data, error } = await supabase.from('pantry_items').select('*');
    if (error) {
      console.error('Error fetching inventory:', error.message);
      return;
    }
    if (data) setItems(data);
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('pantry_items').delete().eq('id', id);
    if (error) {
      Alert.alert('Error', 'Could not delete item: ' + error.message);
      return;
    }
    fetchItems(); 
  }

  async function addItem() {
    if (!session) {
      Alert.alert('Error', 'You are not logged in. Please go to the Profile tab and sign in.');
      return; 
    }
    
    if (!newItemName.trim()) {
      Alert.alert('Missing Info', 'Please enter an item name.');
      return;
    }

    const expiresInString = expiryNumber ? `${expiryNumber} ${expiryUnit}` : 'Unknown';

    const { error } = await supabase.from('pantry_items').insert([
      { 
        item_name: newItemName, 
        expires_in: expiresInString, 
        quantity: newItemQuantity || '1', 
        user_id: session.user.id 
      }
    ]); 
    
    if (error) {
      Alert.alert('Database Error', error.message || 'Failed to add item');
      return; 
    }

    setNewItemName('');
    setExpiryNumber('');
    setExpiryUnit('days');
    setNewItemQuantity('1');
    setModalVisible(false);
    
    fetchItems();
  }

  async function scanItem() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'GScan needs camera access to read expiry dates!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, 
      quality: 0.2,         
      base64: true,         
    });

    if (!result.canceled && result.assets[0].base64) {
      try {
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
           Alert.alert('Configuration Error', 'API key is missing.');
           return;
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

        const prompt = `Analyze this product image. Extract the product name and the expiration date. 
        Respond ONLY in this exact JSON format, nothing else:
        {
          "itemName": "Name of product",
          "expiryNumber": "number only",
          "expiryUnit": "days, months, or years"
        }
        If you cannot find a date, return "" for the number and "days" for the unit.`;

        const imagePart = {
          inlineData: {
            data: result.assets[0].base64,
            mimeType: 'image/jpeg',
          }
        };

        Alert.alert('Scanning...', 'The AI is analyzing your image.');
        
        let aiResult;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            aiResult = await model.generateContent([prompt, imagePart]);
            break; 
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) throw error; 
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
          }
        }
        
        if (!aiResult) throw new Error("AI failed to return data");

        const text = aiResult.response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(cleanText);

        setNewItemName(aiData.itemName || '');
        setExpiryNumber(aiData.expiryNumber || '');
        
        const validUnits = ['days', 'months', 'years'];
        const unit = (aiData.expiryUnit || 'days').toLowerCase();
        setExpiryUnit(validUnits.includes(unit) ? unit : 'days');

        setModalVisible(true);

      } catch (error) {
        console.error(error);
        Alert.alert('Scan Failed', 'The AI could not read this image clearly.');
      }
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textMain }]}>Inventory</Text>
        <TouchableOpacity onPress={() => setIsGridView(!isGridView)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>{isGridView ? 'List View' : 'Grid View'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          key={isGridView ? 'G' : 'L'} 
          data={items}
          numColumns={isGridView ? 2 : 1}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, { backgroundColor: colors.card, flex: isGridView ? 0.5 : 1 }]}>
              <Text style={[styles.itemName, { color: colors.textMain }]}>{item.item_name}</Text>
              <Text style={{ color: colors.textMain }}>Qty: {item.quantity}</Text>
              <Text style={{ color: '#E63946', marginTop: 5, fontSize: 12 }}>Exp: {item.expires_in}</Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteItem(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.addButton, { flex: 1, marginRight: 5 }]} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Manual Add</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.scanButton, { flex: 1, marginLeft: 5 }]} onPress={scanItem}>
            <Text style={styles.addButtonText}>📷 Scan Item</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>Add Pantry Item</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.borderColor }]}
              placeholder="Item Name (e.g., Milk)"
              placeholderTextColor="#888"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            
            <Text style={{ color: colors.textMain, fontWeight: 'bold', marginBottom: 5, marginLeft: 2 }}>Expires In:</Text>
            <View style={styles.expiryRow}>
              <TextInput
                style={[styles.input, styles.expiryInput, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.borderColor }]}
                placeholder="e.g., 5"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={expiryNumber}
                onChangeText={setExpiryNumber}
              />
              <View style={styles.unitContainer}>
                {['days', 'months', 'years'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => setExpiryUnit(unit)}
                    style={[
                      styles.unitButton,
                      {
                        backgroundColor: expiryUnit === unit ? '#2A9D8F' : colors.inputBg,
                        borderColor: expiryUnit === unit ? '#2A9D8F' : colors.borderColor,
                      }
                    ]}
                  >
                    <Text style={{
                      color: expiryUnit === unit ? '#FFF' : colors.textMain,
                      fontWeight: expiryUnit === unit ? 'bold' : 'normal',
                      textTransform: 'capitalize'
                    }}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.borderColor }]}
              placeholder="Quantity (e.g., 2)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#555' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2A9D8F' }]} onPress={addItem}>
                <Text style={styles.btnText}>Save Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  toggleBtn: { backgroundColor: '#333', padding: 8, borderRadius: 8 },
  toggleText: { color: '#FFF' },
  content: { flex: 1, padding: 20 },
  itemCard: { padding: 15, borderRadius: 10, margin: 5, elevation: 2 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  deleteBtn: { marginTop: 10, backgroundColor: '#E63946', padding: 8, borderRadius: 5, alignItems: 'center' },
  deleteText: { color: 'white', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  addButton: { backgroundColor: '#2A9D8F', padding: 15, borderRadius: 30, alignItems: 'center' },
  scanButton: { backgroundColor: '#E76F51', padding: 15, borderRadius: 30, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalCard: { padding: 20, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  expiryInput: { flex: 1, marginBottom: 0, marginRight: 10 },
  unitContainer: { flexDirection: 'row' },
  unitButton: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginLeft: 5 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});