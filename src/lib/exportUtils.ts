export const exportToCSV = (
  data: Record<string, unknown>[],
  filename: string,
  headers: string[]
) => {
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => `"${(row[header] as string | number | boolean | undefined) ?? ''}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
