// utils/export.js
import * as FileSystem from 'expo-file-system';
import * as Sharing    from 'expo-sharing';
import { Asset }       from 'expo-asset';
import XLSX            from 'xlsx';
import { formatSeconds } from './time';

export async function exportToExcel({ jobInfo, registros }) {
  try {
    // 1) Descargar plantilla
    const asset = Asset.fromModule(require('../assets/template_time_formatted_v6.xlsx'));
    await asset.downloadAsync();
    const templateUri = asset.localUri;

    // 2) Leer plantilla en base64
    const b64 = await FileSystem.readAsStringAsync(templateUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    const wb = XLSX.read(b64, { type: 'base64', cellStyles: true });
    const ws = wb.Sheets['Hoja 1'];

    // Helpers
    function setCell(addr, props) {
      const prev = ws[addr] || {};
      ws[addr] = { ...prev, ...props };
    }

    // 3) Cabecera
    setCell('B2', { t: 's', v: jobInfo.fecha });
    setCell('B3', { t: 's', v: jobInfo.operacion });
    setCell('B4', { t: 's', v: jobInfo.nombre });
    setCell('B5', { t: 's', v: jobInfo.trabajador });

    // 4) Tabla principal
    registros.forEach((r, i) => {
      const row = 10 + i;
      setCell(`A${row}`, { t: 'n', v: i + 1 });
      setCell(`B${row}`, { t: 's', v: r.proceso });
      const days = r.tiempo / 86400;
      setCell(`C${row}`, { t: 'n', v: days, z: 'hh:mm:ss' });
      setCell(`I${row}`, { t: 's', v: r.observaciones || '' });
    });

    // 5) Herramienta/EPP
    registros.forEach((r, i) => {
      const toolRow = 2 + i;
      setCell(`K${toolRow}`, { t: 's', v: r.herramienta || '' });
      setCell(`L${toolRow}`, { t: 's', v: r.epp || '' });
    });

    // 6) Ajustar rango
    ws['!ref'] = 'A1:L31';

    // 6b) Hipervínculo a la imagen en B40
    if (jobInfo.image) {
      setCell('B40', {
        t: 's',
        v: 'Ver imagen',
        l: {
          Target: jobInfo.image,
          Tooltip: 'Haz clic para ver la imagen del mueble'
        }
      });
    }

    // 7) Serializar y guardar
    const outB64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const outUri = `${FileSystem.documentDirectory}Registro_${jobInfo.nombre}.xlsx`;
    await FileSystem.writeAsStringAsync(outUri, outB64, {
      encoding: FileSystem.EncodingType.Base64
    });

    // 8) Compartir
    await Sharing.shareAsync(outUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Registro ${jobInfo.nombre}`
    });
  } catch (err) {
    console.error('❌ Error exportToExcel:', err);
  }
}
