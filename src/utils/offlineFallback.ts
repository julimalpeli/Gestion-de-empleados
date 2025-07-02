// Offline fallback data when Supabase is not available

export const fallbackEmployeeData = {
  id: "d6f06332-1d49-4935-b931-5d7657d58468",
  name: "Porras Daiana Ayelen",
  email: "daianaayelen0220@gmail.com",
  position: "Mesera",
  startDate: "2024-01-15",
  vacationDays: 14,
  vacationsTaken: 3,
  status: "active",
  dni: "44586777",
  documentType: "DNI",
  phone: "",
  address: "",
};

export const fallbackPayrollData = [
  {
    id: "payroll-1",
    employeeId: "d6f06332-1d49-4935-b931-5d7657d58468",
    period: "2024-11",
    baseDays: 30,
    holidayDays: 2,
    whiteAmount: 180000,
    informalAmount: 120000,
    presentismoAmount: 15000,
    aguinaldo: 0,
    advances: 30000,
    discounts: 5000,
    overtimeHours: 8,
    overtimeAmount: 12000,
    bonusAmount: 10000,
    holidayBonus: 8000,
    netTotal: 310000,
    status: "processed",
    processedDate: "2024-11-30",
  },
  {
    id: "payroll-2",
    employeeId: "d6f06332-1d49-4935-b931-5d7657d58468",
    period: "2024-10",
    baseDays: 30,
    holidayDays: 1,
    whiteAmount: 180000,
    informalAmount: 120000,
    presentismoAmount: 15000,
    aguinaldo: 0,
    advances: 25000,
    discounts: 0,
    overtimeHours: 4,
    overtimeAmount: 6000,
    bonusAmount: 5000,
    holidayBonus: 4000,
    netTotal: 305000,
    status: "processed",
    processedDate: "2024-10-31",
  },
  {
    id: "payroll-3",
    employeeId: "d6f06332-1d49-4935-b931-5d7657d58468",
    period: "2024-09",
    baseDays: 30,
    holidayDays: 0,
    whiteAmount: 180000,
    informalAmount: 120000,
    presentismoAmount: 15000,
    aguinaldo: 0,
    advances: 20000,
    discounts: 2000,
    overtimeHours: 0,
    overtimeAmount: 0,
    bonusAmount: 0,
    holidayBonus: 0,
    netTotal: 293000,
    status: "processed",
    processedDate: "2024-09-30",
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

// Get fallback data for the current employee
export const getFallbackEmployeeData = (email: string) => {
  if (email === "daianaayelen0220@gmail.com") {
    return {
      employee: fallbackEmployeeData,
      payroll: fallbackPayrollData,
      vacations: fallbackVacationData,
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
  };
};
