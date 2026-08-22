export const MAX_ARCHIVO_BYTES = 4 * 1024 * 1024;

export function urlYoutube(valor) {
  try {
    const entrada = String(valor || '').trim();
    const url = new URL(/^https?:\/\//i.test(entrada) ? entrada : `https://${entrada}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
    if (['youtube.com', 'music.youtube.com'].includes(host)) {
      id = url.searchParams.get('v') || '';
      if (!id) {
        const partes = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(partes[0])) id = partes[1] || '';
      }
    }
    return /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? `https://www.youtube.com/embed/${id}` : '';
  } catch {
    return '';
  }
}

export function tamanioLegible(bytes) {
  const cantidad = Number(bytes) || 0;
  if (cantidad < 1024) return `${cantidad} B`;
  if (cantidad < 1024 * 1024) return `${Math.round(cantidad / 1024)} KB`;
  return `${(cantidad / (1024 * 1024)).toFixed(1).replace('.0', '')} MB`;
}

export function tipoArchivo(tipoMime, nombre = '') {
  const tipo = String(tipoMime || '').toLowerCase();
  const extension = String(nombre).split('.').pop()?.toUpperCase() || '';
  if (tipo.startsWith('image/')) return 'Imagen';
  if (tipo === 'application/pdf' || extension === 'PDF') return 'PDF';
  if (/word/.test(tipo) || ['DOC', 'DOCX'].includes(extension)) return 'Documento';
  if (/excel|spreadsheet/.test(tipo) || ['XLS', 'XLSX', 'CSV'].includes(extension)) return 'Planilla';
  if (/powerpoint|presentation/.test(tipo) || ['PPT', 'PPTX'].includes(extension)) return 'Presentación';
  if (/zip/.test(tipo) || extension === 'ZIP') return 'Archivo ZIP';
  if (tipo.startsWith('text/') || extension === 'TXT') return 'Texto';
  return extension || 'Archivo';
}
