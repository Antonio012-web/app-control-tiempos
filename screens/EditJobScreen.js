// screens/EditJobScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getDB } from '../utils/db';

export default function EditJobScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [operacion, setOperacion] = useState('');
  const [nombre, setNombre] = useState('');
  const [trabajador, setTrabajador] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Editar Job' });

    // pedir permiso
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();

    // cargar datos
    (async () => {
      try {
        const db = getDB();
        const rows = await db.getAllAsync(
          'SELECT operacion, nombre, trabajador, image FROM jobs WHERE id = ?;',
          jobId
        );
        if (rows.length > 0) {
          const info = rows[0];
          setOperacion(info.operacion);
          setNombre(info.nombre);
          setTrabajador(info.trabajador);
          setImageUri(info.image);
        }
      } catch (e) {
        console.error('Error cargando job para editar:', e);
      }
    })();
  }, []);

  const pickImage = async () => {
    if (!hasPermission) {
      Alert.alert('Sin permiso', 'Permiso denegado para acceder a la galería');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7
      });
      if (!result.cancelled) {
        // adapt to new API with assets
        const uri = result.assets ? result.assets[0].uri : result.uri;
        setImageUri(uri);
      }
    } catch (err) {
      console.error('Error al seleccionar imagen:', err);
    }
  };

  const saveChanges = async () => {
    if (!operacion.trim() || !nombre.trim() || !trabajador.trim()) return;
    try {
      const db = getDB();
      await db.runAsync(
        'UPDATE jobs SET operacion = ?, nombre = ?, trabajador = ?, image = ? WHERE id = ?;',
        operacion,
        nombre,
        trabajador,
        imageUri,
        jobId
      );
      navigation.goBack();
    } catch (e) {
      console.error('Error editando job:', e);
      Alert.alert('Error', 'No fue posible guardar los cambios');
    }
  };

  const deleteJob = () => {
    Alert.alert('Confirmar eliminación', '¿Eliminar este job y sus registros?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const db = getDB();
            await db.runAsync('DELETE FROM registros WHERE job_id = ?;', jobId);
            await db.runAsync('DELETE FROM jobs WHERE id = ?;', jobId);
            navigation.popToTop();
          } catch (e) {
            console.error('Error eliminando job:', e);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Operación</Text>
        <TextInput
          style={styles.input}
          value={operacion}
          onChangeText={setOperacion}
          placeholder="Ingresa la operación"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Job</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ingresa el nombre del job"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre del trabajador</Text>
        <TextInput
          style={styles.input}
          value={trabajador}
          onChangeText={setTrabajador}
          placeholder="Ingresa el nombre del trabajador"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Imagen del mueble</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        <TouchableOpacity onPress={pickImage} style={styles.button}>
          <Text style={styles.buttonText}>Seleccionar imagen</Text>
        </TouchableOpacity>
      </View>

      <Button title="Guardar cambios" onPress={saveChanges} />
      <View style={styles.deleteContainer}>
        <Button title="Eliminar Job" color="red" onPress={deleteJob} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#A7D7F9' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#333' },
  input: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, fontSize: 16 },
  previewImage: { width: 100, height: 100, marginBottom: 8, borderRadius: 4 },
  button: {
    backgroundColor: '#B9FBC2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: { color: '#333', fontWeight: '600' },
  deleteContainer: { marginTop: 24 }
});
