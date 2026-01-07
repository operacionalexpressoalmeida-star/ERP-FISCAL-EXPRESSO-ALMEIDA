import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Building2,
  Truck,
  Receipt,
  BookOpen,
  Calculator,
  FileBarChart2,
  UserCircle,
  Landmark,
  Archive,
  Printer,
  PieChart,
  CheckSquare,
  FileText,
  Network,
  TrendingUp,
  Settings2,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useErpStore, UserRole } from '@/stores/useErpStore'

export function AppSidebar() {
  const location = useLocation()
  const { userRole, setUserRole } = useErpStore()

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    operator: 'Operador',
    viewer: 'Consulta',
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-900 text-white">
                  <img
                    src="https://img.usecurling.com/i?q=Expresso+Almeida&shape=fill&color=white"
                    alt="Logo"
                    className="size-6 object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold">ERP Fiscal</span>
                  <span className="text-xs text-muted-foreground">
                    Expresso Almeida
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/organization')}
                >
                  <Link to="/organization">
                    <Building2 />
                    <span>Organização</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(
                    '/assets/fixed-assets',
                  )}
                >
                  <Link to="/assets/fixed-assets">
                    <Archive />
                    <span>Ativos Imobilizados</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/contracts')}
                >
                  <Link to="/contracts">
                    <FileText />
                    <span>Contratos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operações & Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/operations/cte')}
                >
                  <Link to="/operations/cte">
                    <Truck />
                    <span>Receitas (CT-e)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(
                    '/operations/expenses',
                  )}
                >
                  <Link to="/operations/expenses">
                    <Receipt />
                    <span>Despesas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(
                    '/financial/reconciliation',
                  )}
                >
                  <Link to="/financial/reconciliation">
                    <Landmark />
                    <span>Conciliação Bancária</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Fiscal & Contábil</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/accounting/lalur')}
                >
                  <Link to="/accounting/lalur">
                    <BookOpen />
                    <span>LALUR (Lucro Real)</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/accounting/taxes')}
                >
                  <Link to="/accounting/taxes">
                    <Calculator />
                    <span>Apuração de Impostos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Relatórios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(
                    '/reports/revenue-analytics',
                  )}
                >
                  <Link to="/reports/revenue-analytics">
                    <TrendingUp />
                    <span>Análise de Receita</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/reports/dre')}
                >
                  <Link to="/reports/dre">
                    <FileBarChart2 />
                    <span>DRE Gerencial</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith('/reports/tax')}
                >
                  <Link to="/reports/tax">
                    <Printer />
                    <span>Relatórios Fiscais</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(
                    '/reports/custom-dashboard',
                  )}
                >
                  <Link to="/reports/custom-dashboard">
                    <PieChart />
                    <span>Dashboards</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userRole === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith('/admin/approvals')}
                  >
                    <Link to="/admin/approvals">
                      <CheckSquare />
                      <span>Aprovações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(
                      '/admin/categorization',
                    )}
                  >
                    <Link to="/admin/categorization">
                      <Settings2 />
                      <span>Categorização</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(
                      '/admin/integrations',
                    )}
                  >
                    <Link to="/admin/integrations">
                      <Network />
                      <span>Integrações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=manager"
                      alt="User"
                    />
                    <AvatarFallback>EA</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Operador</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {roleLabels[userRole]}
                    </span>
                  </div>
                  <UserCircle className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Alternar Perfil</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setUserRole('admin')}>
                  Administrador
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserRole('operator')}>
                  Operador
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserRole('viewer')}>
                  Consulta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
