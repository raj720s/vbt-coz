import * as XLSX from 'xlsx';

export interface ShipmentData {
  SHIPMENT: string;
  CUSTOME: string;
  SUPPLIER: string;
  VOLUME: number;
  Qty: number;
  'RCV/PUG': string;
  POL: string;
  'POL detail': string;
  'POL In FCL Rates?': string;
  'POL In LCL Rates?': string;
  'POL ALTERNATIVE': string;
  Destsite: string;
}

export function createValidExcelFile(): Blob {
  const data: ShipmentData[] = [
    {
      SHIPMENT: 'HL3025608',
      CUSTOME: 'OTTO GME',
      SUPPLIER: 'HUI ZHOU',
      VOLUME: 7.49,
      Qty: 78,
      'RCV/PUG': '14/07/2025',
      POL: 'Yantian',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Haldensleben'
    },
    {
      SHIPMENT: 'HL3025614',
      CUSTOME: 'OTTO GME',
      SUPPLIER: 'CHUNG TA',
      VOLUME: 5.68,
      Qty: 172,
      'RCV/PUG': '14/07/2025',
      POL: 'Yantian',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Peine'
    },
    {
      SHIPMENT: 'HL3025618',
      CUSTOME: 'BON PRIX',
      SUPPLIER: 'SHUASIA I',
      VOLUME: 11.328,
      Qty: 120,
      'RCV/PUG': '17/07/2025',
      POL: 'Yantian',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Haldensleben'
    },
    {
      SHIPMENT: 'HL3025620',
      CUSTOME: 'BON PRIX',
      SUPPLIER: 'CHUNG TA',
      VOLUME: 8.92,
      Qty: 95,
      'RCV/PUG': '17/07/2025',
      POL: 'Yantian',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Peine'
    },
    {
      SHIPMENT: 'HL3025625',
      CUSTOME: 'OTTO GME',
      SUPPLIER: 'HUI ZHOU',
      VOLUME: 6.15,
      Qty: 89,
      'RCV/PUG': '21/07/2025',
      POL: 'Qingdao',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Haldensleben'
    },
    {
      SHIPMENT: 'HL3025630',
      CUSTOME: 'BON PRIX',
      SUPPLIER: 'SHUASIA I',
      VOLUME: 9.45,
      Qty: 156,
      'RCV/PUG': '21/07/2025',
      POL: 'Qingdao',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Peine'
    },
    {
      SHIPMENT: 'HL3025635',
      CUSTOME: 'OTTO GME',
      SUPPLIER: 'CHUNG TA',
      VOLUME: 4.78,
      Qty: 67,
      'RCV/PUG': '25/07/2025',
      POL: 'Yantian',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Haldensleben'
    },
    {
      SHIPMENT: 'HL3025640',
      CUSTOME: 'BON PRIX',
      SUPPLIER: 'HUI ZHOU',
      VOLUME: 12.15,
      Qty: 203,
      'RCV/PUG': '25/07/2025',
      POL: 'Qingdao',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Peine'
    },
    {
      SHIPMENT: 'HL3025645',
      CUSTOME: 'OTTO GME',
      SUPPLIER: 'SHUASIA I',
      VOLUME: 7.82,
      Qty: 134,
      'RCV/PUG': '28/07/2025',
      POL: 'Yantian',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Haldensleben'
    },
    {
      SHIPMENT: 'HL3025650',
      CUSTOME: 'BON PRIX',
      SUPPLIER: 'CHUNG TA',
      VOLUME: 10.25,
      Qty: 178,
      'RCV/PUG': '28/07/2025',
      POL: 'Qingdao',
      'POL detail': '',
      'POL In FCL Rates?': '',
      'POL In LCL Rates?': '',
      'POL ALTERNATIVE': '',
      Destsite: 'Peine'
    }
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipments');
  
  // Write to buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Create blob
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

export function downloadValidExcelFile() {
  const blob = createValidExcelFile();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'valid_shipments.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
