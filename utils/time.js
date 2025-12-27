// utils/time.js

/**
 * Devuelve la fecha y hora local en formato "DD-MM-YYYY HH:MM:SS".
 * @param {Date|string} date - Objeto Date o cadena ISO.
 * @returns {string}
 */
export function formatLocalDateTime(date = new Date()) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${mi}:${ss}`;
  }
  
  /**
   * Formatea una fecha/hora ISO a "DD/MM/YYYY HH:MM:SS".
   * @param {string} iso - Cadena ISO.
   * @returns {string}
   */
  export function formatDateTime(iso) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  }
  
  /**
   * Convierte una cadena "HH:MM:SS" a segundos.
   * @param {string} str
   * @returns {number}
   */
  export function parseTimeString(str) {
    const [hh = 0, mm = 0, ss = 0] = str
      .split(':')
      .map((p) => parseInt(p, 10) || 0);
    return hh * 3600 + mm * 60 + ss;
  }
  
  /**
   * Formatea segundos a "HH:MM:SS".
   * @param {number} sec
   * @returns {string}
   */
  export function formatSeconds(sec) {
    const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  
  /**
   * Aplica máscara "HH:MM:SS" mientras el usuario escribe.
   * @param {string} value
   * @returns {string}
   */
  export function formatInputTime(value) {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
  }
  