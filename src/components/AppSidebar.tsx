import { Home, Users, Calculator, FileBarChart, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Empleados",
    url: "/empleados",
    icon: Users,
  },
  {
    title: "Liquidaciones",
    url: "/liquidaciones",
    icon: Calculator,
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: FileBarChart,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6 bg-gradient-to-br from-sidebar-background to-sidebar-accent">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ceramic-gold text-ceramic-emerald font-bold text-lg shadow-lg border-2 border-ceramic-cream/20">
            RH
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">
              RestauranteHR
            </h1>
            <p className="text-sm text-ceramic-gold font-medium">
              Gestión de Personal
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-ceramic-gold font-semibold text-xs uppercase tracking-wider px-4 py-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                          isActive
                            ? "bg-ceramic-gold text-ceramic-emerald shadow-md scale-105 border border-ceramic-cream/30"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-sm border border-transparent",
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-ceramic-gold/30 p-4 bg-gradient-to-t from-sidebar-accent to-transparent">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-ceramic-terracotta hover:text-ceramic-cream transition-all duration-200 rounded-xl py-3 px-4">
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
