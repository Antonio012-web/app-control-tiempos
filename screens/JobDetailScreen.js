import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDB } from '../utils/db';
import {
  parseTimeString,
  formatSeconds,
  formatInputTime
} from '../utils/time';
import { exportToExcel } from '../utils/export';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [jobInfo, setJobInfo] = useState({ operacion: '', nombre: '', trabajador: '', fecha: '' });
  const [proceso, setProceso] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [herramienta, setHerramienta] = useState('');
  const [epp, setEpp] = useState('');
  const [registros, setRegistros] = useState([]);
  const [showInfo, setShowInfo] = useState(true);

  // Cronómetro
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);

  const formatTime = ms => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    const pad = (n, z = 2) => n.toString().padStart(z, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(hundredths)}`;
  };

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedMs;
    intervalRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 50);
  };
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };
  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setElapsedMs(0);
  };

  // Carga inicial de job y registros
  useEffect(() => {
    async function fetchJob() {
      try {
        const db = getDB();
        const rows = await db.getAllAsync(
          'SELECT operacion, nombre, trabajador, fecha FROM jobs WHERE id = ?;', jobId
        );
        if (rows.length) {
          setJobInfo(rows[0]);
          navigation.setOptions({ title: rows[0].nombre });
        }
      } catch (e) {
        console.error('Error cargando info de job:', e);
      }
    }
    fetchJob();
  }, [jobId, navigation]);

  const loadRegistros = useCallback(async () => {
    try {
      const db = getDB();
      const rows = await db.getAllAsync(
        `SELECT id, proceso, tiempo, observaciones, herramienta, epp
         FROM registros WHERE job_id = ? ORDER BY id DESC;`, jobId
      );
      setRegistros(rows);
    } catch (e) {
      console.error('Error cargando registros:', e);
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      loadRegistros();
    }, [loadRegistros])
  );

  const addRegistro = async () => {
    if (!proceso.trim() || !tiempo) return;
    try {
      const sec = parseTimeString(tiempo);
      const db = getDB();
      await db.runAsync(
        `INSERT INTO registros (job_id, proceso, tiempo, observaciones, herramienta, epp)
         VALUES (?, ?, ?, ?, ?, ?);`,
        jobId,
        proceso,
        sec,
        observaciones.trim() || null,
        herramienta.trim() || null,
        epp.trim() || null
      );
      setProceso(''); setTiempo(''); setObservaciones(''); setHerramienta(''); setEpp('');
      loadRegistros();
    } catch (e) {
      console.error('Error agregando registro:', e);
    }
  };

  const totalSec = registros.reduce((sum, r) => sum + r.tiempo, 0);
  const grouped = registros.reduce((acc, r) => {
    if (!acc[r.proceso]) acc[r.proceso] = { proceso: r.proceso, total: 0, count: 0 };
    acc[r.proceso].total += r.tiempo;
    acc[r.proceso].count += 1;
    return acc;
  }, {});
  const promedios = Object.values(grouped).map(g => ({ proceso: g.proceso, promedio: g.total / g.count }));

  const handleExport = () => exportToExcel({ jobInfo, registros, totalSec, promedios });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.timerBox}>
        <Text style={styles.timerText}>{formatTime(elapsedMs)}</Text>
        <View style={styles.timerButtons}>
          <TouchableOpacity onPress={isRunning ? stopTimer : startTimer} style={[styles.timerBtn, isRunning && styles.activeBtn]}>
            <Text style={styles.timerBtnText}>{isRunning ? 'Detener' : 'Iniciar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetTimer} style={styles.timerBtn}>
            <Text style={styles.timerBtnText}>Restablecer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleSection}>
        <TouchableOpacity onPress={() => setShowInfo(prev => !prev)}>
          <Text style={styles.toggleText}>{showInfo ? 'Ocultar Info' : 'Mostrar Info'}</Text>
        </TouchableOpacity>
      </View>

      {showInfo && (
        <View style={styles.infoSection}>
          <Text style={styles.label}>Operación: <Text style={styles.value}>{jobInfo.operacion}</Text></Text>
          <Text style={styles.label}>Job: <Text style={styles.value}>{jobInfo.nombre}</Text></Text>
          <Text style={styles.label}>Operador: <Text style={styles.value}>{jobInfo.trabajador}</Text></Text>
          <Text style={styles.label}>Fecha: <Text style={styles.value}>{jobInfo.fecha}</Text></Text>
        </View>
      )}

      <View style={styles.entrySection}>
        <TextInput style={[styles.input, styles.inputBold]} placeholder="Proceso" placeholderTextColor="#333" value={proceso} onChangeText={setProceso} />
        <TextInput style={[styles.input, styles.inputBold]} placeholder="HH:MM:SS" placeholderTextColor="#333" keyboardType="numeric" value={tiempo} onChangeText={t => setTiempo(formatInputTime(t))} maxLength={8} />
        <TextInput style={[styles.input, styles.inputBold]} placeholder="Observaciones (opcional)" placeholderTextColor="#333" value={observaciones} onChangeText={setObservaciones} />
        <TextInput style={[styles.input, styles.inputBold]} placeholder="Herramienta (opcional)" placeholderTextColor="#333" value={herramienta} onChangeText={setHerramienta} />
        <TextInput style={[styles.input, styles.inputBold]} placeholder="EPP (opcional)" placeholderTextColor="#333" value={epp} onChangeText={setEpp} />
        <Button title="Agregar Registro" onPress={addRegistro} />
      </View>

      <FlatList
        data={registros}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowText}>{item.proceso}</Text>
              {item.observaciones && <Text style={styles.obsText}>{item.observaciones}</Text>}
              {item.herramienta && <Text style={styles.herrText}>🛠 {item.herramienta}</Text>}
              {item.epp && <Text style={styles.eppText}>🦺 {item.epp}</Text>}
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowText}>{formatSeconds(item.tiempo)}</Text>
              <TouchableOpacity style={styles.editIcon} onPress={() => navigation.navigate('EditRegistro', { registroId: item.id, jobId })}>
                <Ionicons name="create-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.exportContainer}>
        <Button title="Exportar a Excel" onPress={handleExport} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#A7D7F9', padding: 16 },
  timerBox: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 16 },
  timerText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  timerButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  timerBtn: { flex: 1, marginHorizontal: 8, paddingVertical: 10, backgroundColor: '#B9FBC2', borderRadius: 6, alignItems: 'center' },
  activeBtn: { backgroundColor: '#FFA77D' },
  timerBtnText: { fontSize: 16, fontWeight: '600' },
  toggleSection: { marginBottom: 8, alignItems: 'center' },
  toggleText: { color: '#0066CC', fontWeight: '600' },
  infoSection: { marginBottom: 24, backgroundColor: '#E0F7FA', padding: 12, borderRadius: 8 },
  label: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  value: { fontWeight: 'normal' },
  entrySection: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 16 },
  input: { backgroundColor: '#F0F0F0', borderRadius: 4, padding: 8, marginBottom: 12 },
  inputBold: { fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#B2EBF2' },
  rowLeft: { flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowText: { fontSize: 14 },
  obsText: { fontSize: 12, color: '#555', fontStyle: 'italic' },
  herrText: { fontSize: 12, color: '#333', marginTop: 2 },
  eppText: { fontSize: 12, color: '#333', marginTop: 2 },
  editIcon: { marginLeft: 8 },
  exportContainer: { paddingVertical: 16 }
});
