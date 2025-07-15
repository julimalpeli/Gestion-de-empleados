import { SidebarTrigger } from "@/components/ui/sidebar";

const EmployeesSimple = () => {
  console.log("🧪 EmployeesSimple component rendering...");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Empleados (Funcionando)</h1>
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
            Si ves esto, el problema está en algún hook del componente original.
          </p>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold text-blue-800">
            Lista de empleados simulada:
          </h3>
          <ul className="mt-2 space-y-1 text-blue-700">
            <li>• Porras Daiana Ayelen - Jefe de Salón</li>
            <li>• Juan Manuel Giamatolo - Barra</li>
            <li>• Roa Maite Iara - Mesero/a</li>
            <li>• Tablar Ignacio - Jefe de Cocina</li>
            <li>• Gutierrez Javier Maximiliano - Ayudante de Cocina</li>
            <li>• Acevedo Rosa Graciela - Cocinero</li>
            <li>• Carcamo Mauricio Damian - Cajero/a</li>
            <li>• Bustamante Mantilla Carlos Manuel - Tareas de Limpieza</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeesSimple;
