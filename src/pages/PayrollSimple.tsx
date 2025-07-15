import { SidebarTrigger } from "@/components/ui/sidebar";

const PayrollSimple = () => {
  console.log("🧪 PayrollSimple component rendering...");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Liquidaciones (Funcionando)</h1>
          <p className="text-muted-foreground">
            Versión simplificada para debug
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold text-green-800">
            ✅ Componente renderizado correctamente
          </h2>
          <p className="text-green-700">
            Si ves esto, el problema está en algún hook del componente Payroll
            original.
          </p>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold text-blue-800">
            Liquidaciones simuladas por empleado:
          </h3>
          <ul className="mt-2 space-y-2 text-blue-700">
            <li>
              • <strong>Porras Daiana Ayelen</strong> - Julio 2025: $840,000
            </li>
            <li>
              • <strong>Juan Manuel Giamatolo</strong> - Julio 2025: $720,000
            </li>
            <li>
              • <strong>Roa Maite Iara</strong> - Julio 2025: $580,000
            </li>
            <li>
              • <strong>Tablar Ignacio</strong> - Julio 2025: $1,200,000
            </li>
          </ul>
        </div>

        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold text-yellow-800">
            Estado de liquidaciones:
          </h3>
          <ul className="mt-2 space-y-1 text-yellow-700">
            <li>• Pagadas: 2 liquidaciones</li>
            <li>• Procesadas: 1 liquidación</li>
            <li>• Aprobadas: 1 liquidación</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PayrollSimple;
