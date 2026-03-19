export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Format rows
  const rows = data.map(row => {
    return headers.map(header => {
      let val = row[header];
      // Handle null/undefined
      if (val === null || val === undefined) val = '';
      // Escape quotes and wrap in quotes if contains comma
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });

  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n');
  
  // Create blob and trigger download
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for UTF-8 BOM
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
