// screens/SummaryScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { getDB } from '../utils/db';
import { formatSeconds } from '../utils/time';
import { exportToExcel } from '../utils/export';

export default function SummaryScreen({ route }) {
  const { jobId, jobName } = route.params;
  const [totalSec, setTotalSec] = useState(0);
  const [promedios, setPromedios] = useState([]);
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    (async () => {
      const db = getDB();
      const totalRows = await db.getAllAsync(
        'SELECT SUM(tiempo) AS total FROM registros WHERE job_id = ?;',
        jobId
      );
      setTotalSec(totalRows[0]?.total || 0);

      const avgRows = await db.getAllAsync(
        `SELECT proceso, AVG(tiempo) AS promedio
         FROM registros WHERE job_id = ? GROUP BY proceso;`,
        jobId
      );
      setPromedios(avgRows);

      const regRows = await db.getAllAsync(
        'SELECT proceso, tiempo, observaciones FROM registros WHERE job_id = ?;',
        jobId
      );
      setRegistros(regRows);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Resumen de {jobName}</Text>
      <Text style={styles.total}>Tiempo total: {formatSeconds(totalSec)}</Text>
      <Text style={styles.subheading}>Promedio por proceso:</Text>
      <FlatList
        data={promedios}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>{item.proceso}</Text>
            <Text>{formatSeconds(Math.round(item.promedio))}</Text>
          </View>
        )}
      />

      <Button
        title="Exportar a Excel"
        onPress={() => exportToExcel(jobName, registros, totalSec, promedios)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#A7D7F9'
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  total: {
    fontSize: 20,
    marginBottom: 16
  },
  subheading: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  }
});
