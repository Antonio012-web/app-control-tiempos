// screens/JobsListScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Button,
  Image,
  Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDB } from '../utils/db';
import { Ionicons } from '@expo/vector-icons';

export default function JobsListScreen({ navigation }) {
  const [rawJobs, setRawJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  const loadJobs = async () => {
    const db = getDB();
    const rows = await db.getAllAsync(
      `SELECT j.id, j.operacion, j.nombre, j.trabajador, j.fecha, j.image,
        (SELECT COUNT(*) FROM registros r WHERE r.job_id = j.id) AS registrosCount
       FROM jobs j`
    );
    setRawJobs(rows);
  };

  useFocusEffect(useCallback(() => { loadJobs(); }, []));

  useEffect(() => {
    const filtered = rawJobs
      .filter(item =>
        item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fecha.includes(searchQuery)
      )
      .sort((a, b) => {
        const da = new Date(a.fecha.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$2-$1'));
        const db_ = new Date(b.fecha.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$2-$1'));
        return sortDesc ? db_ - da : da - db_;
      });
    setJobs(filtered);
  }, [rawJobs, searchQuery, sortDesc]);

  const confirmDelete = id => {
    Alert.alert('Confirmar eliminación', '¿Eliminar este job y sus registros?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          const db = getDB();
          await db.runAsync('DELETE FROM registros WHERE job_id = ?;', id);
          await db.runAsync('DELETE FROM jobs WHERE id = ?;', id);
          loadJobs();
        }
      }
    ]);
  };

  const openImageModal = uri => {
    setModalImageUri(uri);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setModalImageUri(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Texto + Imagen */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id, jobName: item.nombre })}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.title}>{item.nombre}</Text>
          <Text style={styles.operator}>Operador: {item.trabajador}</Text>
          <Text style={styles.date}>{item.fecha}</Text>
          <Text style={styles.count}>{item.registrosCount} registros</Text>
        </View>
        {item.image && (
          <TouchableOpacity onPress={() => openImageModal(item.image)}>
            <Image source={{ uri: item.image }} style={styles.thumbnail} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Iconos fijos */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditJob', { jobId: item.id, jobName: item.nombre })}
        >
          <Ionicons name="create-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={{ marginLeft: 16 }}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Total de jobs registrados: {jobs.length}</Text>
      <View style={styles.controls}>
        <TextInput
          style={styles.search}
          placeholder="Buscar por job o fecha"
          placeholderTextColor="#333"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button title={sortDesc ? 'Recientes' : 'Antiguos'} onPress={() => setSortDesc(p => !p)} />
      </View>
      <FlatList data={jobs} keyExtractor={i => i.id.toString()} renderItem={renderItem} />

      {/* Modal para imagen completa */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalClose} onPress={closeImageModal}>
            <Ionicons name="close-circle" size={36} color="#FFF" />
          </TouchableOpacity>
          {modalImageUri && (
            <Image source={{ uri: modalImageUri }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddJob')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#A7D7F9', padding: 16 },
  header: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },

  controls: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center'
  },
  search: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flexShrink: 1,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 50,
    marginLeft: 40,
  },
  cardActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row'
  },

  title: { fontSize: 18, fontWeight: 'bold' },
  operator: { fontSize: 14, color: '#333', marginTop: 2 },
  date: { fontSize: 12, color: '#666', marginTop: 4 },
  count: { fontSize: 12, color: '#333', marginTop: 8, fontStyle: 'italic' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#B9FBC2',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fabText: { fontSize: 24, color: '#333' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullImage: {
    width: '90%',
    height: '80%'
  },
  modalClose: {
    position: 'absolute',
    top: 40,
    right: 20
  }
});
