/**
 * Utilitário de exportação para CSV com suporte a UTF-8 BOM e escape de caracteres especiais (SPEC-UI-001 / B-01).
 * Suporta tanto lista de objetos como formato clássico (cabeçalhos + linhas).
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void;
export function exportToCsv(
  filename: string,
  data: Record<string, string | number | boolean | null | undefined>[]
): void;
export function exportToCsv(
  filename: string,
  headersOrData: string[] | Record<string, string | number | boolean | null | undefined>[],
  optionalRows?: (string | number | boolean | null | undefined)[][]
): void {
  const escapeCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  let headerLine = '';
  let rowLines: string[] = [];

  if (Array.isArray(optionalRows)) {
    const headers = headersOrData as string[];
    headerLine = headers.map(escapeCell).join(';');
    rowLines = optionalRows.map((row) => row.map(escapeCell).join(';'));
  } else {
    const data = headersOrData as Record<string, string | number | boolean | null | undefined>[];
    if (data.length === 0) {
      headerLine = '';
      rowLines = [];
    } else {
      const keys = Object.keys(data[0]);
      headerLine = keys.map(escapeCell).join(';');
      rowLines = data.map((item) => keys.map((key) => escapeCell(item[key])).join(';'));
    }
  }

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].filter(Boolean).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
