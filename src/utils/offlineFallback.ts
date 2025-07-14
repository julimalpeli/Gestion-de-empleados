// Offline fallback data when Supabase is not available

// Real employees data for fallback
export const fallbackEmployeesData = [
  {
    id: "d6f06332-1d49-4935-b931-5d7657d58468",
    name: "Porras Daiana Ayelen",
    email: "daianaayelen0220@gmail.com",
    position: "Jefe de Salón",
    startDate: "2023-04-12",
    vacationDays: 14,
    vacationsTaken: 0,
    status: "active",
    dni: "44586777",
    documentType: "dni",
    phone: "",
    address: "Calle 158 e/ 61 y 62 nro1443",
    whiteWage: 425545,
    informalWage: 399455,
    dailyWage: 27500,
    presentismo: 50000,
    losesPresent: false,
  },
  {
    id: "3a6a388e-cbe0-4519-b623-c68c3ec5032f",
    name: "Juan Manuel Giamatolo",
    email: "juanmgiamatolo@gmail.com",
    position: "Barra",
    startDate: "2025-02-01",
    vacationDays: 14,
    vacationsTaken: 0,
    status: "active",
    dni: "35940844",
    documentType: "dni",
    phone: "",
    address: "Diag. 682 bis nro63 - Villa Elvira",
    whiteWage: 442308,
    informalWage: 217692,
    dailyWage: 22000,
    presentismo: 70000,
    losesPresent: false,
  },
  {
    id: "a607745d-963f-42b8-badf-49b95ae52a4f",
    name: "Roa Maite Iara",
    email: "roaiara797@gmail.com",
    position: "Mesero/a",
    startDate: "2024-12-10",
    vacationDays: 14,
    vacationsTaken: 0,
    status: "active",
    dni: "45318581",
    documentType: "dni",
    phone: "",
    address: "70 nro 3218 e/ 159 y 159bis",
    whiteWage: 301957,
    informalWage: 228043,
    dailyWage: 17666.67,
    presentismo: 70000,
    losesPresent: false,
  },
  {
    id: "f33d0128-11b8-4ff2-b226-c6e9a2014fed",
    name: "Tablar Ignacio",
    email: "nachito_ja@hotmail.com",
    position: "Jefe de Cocina",
    startDate: "2024-09-30",
    vacationDays: 14,
    vacationsTaken: 0,
    status: "active",
    dni: "30728007",
    documentType: "dni",
    phone: "",
    address: "Calle 57 e/ 13 y 14 nro 944",
    whiteWage: 421907,
    informalWage: 728093,
    dailyWage: 38333.33,
    presentismo: 50000,
    losesPresent: false,
  },
];

export const fallbackEmployeeData = fallbackEmployeesData[0]; // Keep for compatibility

export const fallbackPayrollData = [
  {
    id: "payroll-1",
    employeeId: "d6f06332-1d49-4935-b931-5d7657d58468",
    employeeName: "Porras Daiana Ayelen",
    period: "2025-07",
    baseDays: 30,
    holidayDays: 2,
    baseAmount: 425545,
    whiteAmount: 425545,
    informalAmount: 399455,
    presentismoAmount: 50000,
    aguinaldo: 0,
    advances: 30000,
    discounts: 5000,
    overtimeHours: 8,
    overtimeAmount: 12000,
    bonusAmount: 10000,
    holidayBonus: 8000,
    netTotal: 840000,
    status: "paid",
    processedDate: "2025-07-14",
  },
  {
    id: "payroll-2",
    employeeId: "3a6a388e-cbe0-4519-b623-c68c3ec5032f",
    employeeName: "Juan Manuel Giamatolo",
    period: "2025-07",
    baseDays: 29,
    holidayDays: 1,
    baseAmount: 442308,
    whiteAmount: 442308,
    informalAmount: 217692,
    presentismoAmount: 70000,
    aguinaldo: 0,
    advances: 25000,
    discounts: 0,
    overtimeHours: 4,
    overtimeAmount: 6000,
    bonusAmount: 5000,
    holidayBonus: 4000,
    netTotal: 720000,
    status: "paid",
    processedDate: "2025-07-14",
  },
  {
    id: "payroll-3",
    employeeId: "a607745d-963f-42b8-badf-49b95ae52a4f",
    employeeName: "Roa Maite Iara",
    period: "2025-07",
    baseDays: 30,
    holidayDays: 0,
    baseAmount: 301957,
    whiteAmount: 301957,
    informalAmount: 228043,
    presentismoAmount: 70000,
    aguinaldo: 0,
    advances: 20000,
    discounts: 2000,
    overtimeHours: 0,
    overtimeAmount: 0,
    bonusAmount: 0,
    holidayBonus: 0,
    netTotal: 580000,
    status: "approved",
    processedDate: "2025-07-14",
  },
  {
    id: "payroll-4",
    employeeId: "f33d0128-11b8-4ff2-b226-c6e9a2014fed",
    employeeName: "Tablar Ignacio",
    period: "2025-07",
    baseDays: 30,
    holidayDays: 1,
    baseAmount: 421907,
    whiteAmount: 421907,
    informalAmount: 728093,
    presentismoAmount: 50000,
    aguinaldo: 0,
    advances: 0,
    discounts: 0,
    overtimeHours: 10,
    overtimeAmount: 15000,
    bonusAmount: 0,
    holidayBonus: 0,
    netTotal: 1200000,
    status: "processed",
    processedDate: "2025-07-14",
  },
];

export const fallbackVacationData = [
  {
    id: "vacation-1",
    employeeId: "d6f06332-1d49-4935-b931-5d7657d58468",
    startDate: "2024-12-20",
    endDate: "2024-12-27",
    days: 5,
    reason: "Vacaciones de fin de año",
    status: "approved",
    requestDate: "2024-11-15",
    approvedBy: "Julian Malpeli",
    approvedDate: "2024-11-16",
  },
  {
    id: "vacation-2",
    employeeId: "d6f06332-1d49-4935-b931-5d7657d58468",
    startDate: "2024-07-15",
    endDate: "2024-07-19",
    days: 5,
    reason: "Vacaciones de invierno",
    status: "approved",
    requestDate: "2024-06-20",
    approvedBy: "Julian Malpeli",
    approvedDate: "2024-06-21",
  },
];

export const fallbackDocumentData = [
  {
    id: "doc-1",
    originalFileName: "Contrato_Porras_Daiana.pdf",
    category: "contract",
    uploadedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "doc-2",
    originalFileName: "Liquidacion_Nov_2024.pdf",
    category: "payroll",
    uploadedAt: "2024-11-30T15:30:00Z",
  },
  {
    id: "doc-3",
    originalFileName: "Certificado_Trabajo.pdf",
    category: "certificate",
    uploadedAt: "2024-10-01T09:15:00Z",
  },
];

// Check if we're in offline mode
export const isOfflineMode = () => {
  // You could enhance this with actual network detection
  return !navigator.onLine;
};

// Get fallback payroll data
export const getFallbackPayrollData = () => {
  return fallbackPayrollData;
};

// Get all fallback employees data
export const getFallbackEmployeesData = () => {
  return fallbackEmployeesData;
};

// Get fallback data for the current employee
export const getFallbackEmployeeData = (email: string) => {
  if (email === "daianaayelen0220@gmail.com") {
    return {
      employee: fallbackEmployeeData,
      payroll: fallbackPayrollData,
      vacations: fallbackVacationData,
      documents: fallbackDocumentData,
    };
  }

  // Default fallback for other employees
  return {
    employee: {
      id: "fallback-employee",
      name: "Empleado",
      email: email,
      position: "Empleado",
      startDate: "2024-01-01",
      vacationDays: 14,
      vacationsTaken: 0,
      status: "active",
      dni: "00000000",
      documentType: "DNI",
      phone: "",
      address: "",
    },
    payroll: [],
    vacations: [],
    documents: [],
  };
};
