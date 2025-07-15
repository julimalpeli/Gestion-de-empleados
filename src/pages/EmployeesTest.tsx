import { SidebarTrigger } from "@/components/ui/sidebar";

const EmployeesTest = () => {
  console.log("🧪 EmployeesTest component is rendering!");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Empleados (Test)</h1>
          <p className="text-muted-foreground">
            Componente de prueba funcionando
          </p>
        </div>
      </div>

      <div className="bg-green-100 p-4 rounded">
        <h2 className="text-lg font-semibold text-green-800">
          ✅ Componente funcionando
        </h2>
        <p className="text-green-700">
          Si ves esto, el problema está en el componente Employees original.
        </p>
      </div>
    </div>
  );
};

export default EmployeesTest;
