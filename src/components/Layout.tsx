/* Layout Component - Wraps the main content with Sidebar and Header */
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useErpStore } from '@/stores/useErpStore'
import { Building, ShieldCheck, ShieldAlert, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Layout() {
  const { companies, selectedCompanyId, setContext, userRole } = useErpStore()

  const RoleIcon =
    userRole === 'admin'
      ? ShieldCheck
      : userRole === 'operator'
        ? ShieldAlert
        : Eye

  const roleColor =
    userRole === 'admin'
      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
      : userRole === 'operator'
        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 justify-between">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedCompanyId} onValueChange={setContext}>
                  <SelectTrigger className="w-[320px]">
                    <SelectValue placeholder="Selecione o Contexto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consolidated" className="font-semibold">
                      Expresso Almeida - Global
                    </SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCompanyId === 'consolidated' && (
                <span className="hidden md:inline-flex text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
                  Modo Gerencial Global
                </span>
              )}
              {selectedCompanyId !== 'consolidated' && (
                <span className="hidden md:inline-flex text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                  Modo Fiscal:{' '}
                  {companies.find((c) => c.id === selectedCompanyId)?.cnpj}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`gap-1 ${roleColor} border-0`}>
              <RoleIcon className="h-3 w-3" />
              <span className="capitalize">{userRole}</span>
            </Badge>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
