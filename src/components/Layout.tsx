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
import { Building } from 'lucide-react'

export default function Layout() {
  const { companies, selectedCompanyId, setContext } = useErpStore()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCompanyId} onValueChange={setContext}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecione o Contexto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consolidated" className="font-semibold">
                    Visão Consolidada (Gerencial)
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
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
                Modo Gerencial Global
              </span>
            )}
            {selectedCompanyId !== 'consolidated' && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                Modo Fiscal:{' '}
                {companies.find((c) => c.id === selectedCompanyId)?.cnpj}
              </span>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
