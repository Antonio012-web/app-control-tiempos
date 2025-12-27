// screens/EditRegistroScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getDB } from '../utils/db';
import { parseTimeString, formatInputTime } from '../utils/time';

export default function EditRegistroScreen({ route, navigation }) {
  const { registroId, jobId } = route.params;
  const [proceso, setProceso] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [herramienta, setHerramienta] = useState('');
  const [epp, setEpp] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const db = getDB();
        const rows = await db.getAllAsync(
          'SELECT proceso, tiempo, observaciones, herramienta, epp FROM registros WHERE id = ?;',
          registroId
        );
        if (rows.length) {
          const r = rows[0];
          setProceso(r.proceso);
          // formatear segundos a HH:MM:SS
          const hh = String(Math.floor(r.tiempo / 3600)).padStart(2, '0');
          const mm = String(Math.floor((r.tiempo % 3600) / 60)).padStart(2, '0');
          const ss = String(r.tiempo % 60).padStart(2, '0');
          setTiempo(`${hh}:${mm}:${ss}`);
          setObservaciones(r.observaciones || '');
          setHerramienta(r.herramienta || '');
          setEpp(r.epp || '');
        }
      } catch (e) {
        console.error('Error cargando registro:', e);
      }
    })();
  }, []);

  const saveChanges = async () => {
    if (!proceso.trim() || !tiempo) {
      Alert.alert('Error', 'Proceso y tiempo son obligatorios.');
      return;
    }
    try {
      const seconds = parseTimeString(tiempo);
      const db = getDB();
      await db.runAsync(
        `UPDATE registros SET proceso = ?, tiempo = ?, observaciones = ?, herramienta = ?, epp = ? WHERE id = ?;`,
        proceso,
        seconds,
        observaciones.trim() || null,
        herramienta.trim() || null,
        epp.trim() || null,
        registroId
      );
      navigation.goBack();
    } catch (e) {
      console.error('Error guardando cambios:', e);
    }
  };

  const deleteRegistro = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Eliminar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDB();
              await db.runAsync('DELETE FROM registros WHERE id = ?;', registroId);
              navigation.goBack();
            } catch (e) {
              console.error('Error eliminando registro:', e);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Proceso</Text>
      <TextInput
        style={styles.input}
        value={proceso}
        onChangeText={setProceso}
      />

      <Text style={styles.label}>Tiempo (HH:MM:SS)</Text>
      <TextInput
        style={styles.input}
        value={tiempo}
        keyboardType="numeric"
        onChangeText={text => setTiempo(formatInputTime(text))}
        maxLength={8}
      />

      <Text style={styles.label}>Observaciones</Text>
      <TextInput
        style={styles.input}
        value={observaciones}
        onChangeText={setObservaciones}
      />

      <Text style={styles.label}>Herramienta</Text>
      <TextInput
        style={styles.input}
        value={herramienta}
        onChangeText={setHerramienta}
      />

      <Text style={styles.label}>Equipo de protección personal</Text>
      <TextInput
        style={styles.input}
        value={epp}
        onChangeText={setEpp}
      />

      <Button title="Guardar Cambios" onPress={saveChanges} />
      <View style={styles.deleteContainer}>
        <Button title="Eliminar Registro" color="red" onPress={deleteRegistro} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#A7D7F9' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 16 },
  deleteContainer: { marginTop: 16 }
});