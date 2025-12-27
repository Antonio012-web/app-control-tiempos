// screens/AddJobScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getDB } from '../utils/db';
import { formatLocalDateTime } from '../utils/time';

export default function AddJobScreen({ navigation }) {
  const [operacion, setOperacion] = useState('');
  const [nombre, setNombre] = useState('');
  const [trabajador, setTrabajador] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Pedir permiso al montar
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Necesito permiso para acceder a la galería');
          setHasPermission(false);
        } else {
          setHasPermission(true);
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No soportado', 'La selección de imágenes no funciona en web');
      return;
    }
    if (!hasPermission) {
      Alert.alert('Sin permiso', 'No puedes seleccionar imagen sin permiso');
      return;
    }
  
    try {
      console.log('pickImage invocado, permiso:', hasPermission);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,  // sigue pudiendo funcionar
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      console.log('resultado picker:', result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log('uri seleccionada:', uri);
        setImageUri(uri);
      }
    } catch (err) {
      console.error('Error en launchImageLibraryAsync:', err);
      Alert.alert('Error al abrir la galería', err.message);
    }
  };  

  const saveJob = async () => {
    if (!operacion.trim() || !nombre.trim() || !trabajador.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos');
      return;
    }
    try {
      const db = getDB();
      const fecha = formatLocalDateTime();
      await db.runAsync(
        `INSERT INTO jobs (operacion, nombre, trabajador, fecha, image)
         VALUES (?, ?, ?, ?, ?);`,
        operacion,
        nombre,
        trabajador,
        fecha,
        imageUri
      );
      navigation.goBack();
    } catch (e) {
      console.error('Error guardando job:', e);
      Alert.alert('Error', 'No fue posible guardar el job');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Operación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa la operación"
          value={operacion}
          onChangeText={setOperacion}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Job</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa el nombre del job"
          value={nombre}
          onChangeText={setNombre}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre del trabajador</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa el nombre del trabajador"
          value={trabajador}
          onChangeText={setTrabajador}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Imagen del mueble</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        <TouchableOpacity onPress={pickImage} style={styles.button}>
          <Text style={styles.buttonText}>Seleccionar imagen</Text>
        </TouchableOpacity>
      </View>

      <Button title="Guardar Job" onPress={saveJob} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#A7D7F9' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#333' },
  input: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, fontSize: 16 },
  button: {
    backgroundColor: '#B9FBC2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: { color: '#333', fontWeight: '600' },
  previewImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
    borderRadius: 4
  }
});
