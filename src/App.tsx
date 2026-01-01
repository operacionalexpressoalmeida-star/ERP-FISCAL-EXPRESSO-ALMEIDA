/* Main App Component - Handles routing */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'

// New ERP Pages
import Index from './pages/Index'
import OrganizationList from './pages/organization/OrganizationList'
import CTeList from './pages/operations/CTeList'
import ExpenseList from './pages/operations/ExpenseList'
import LalurPage from './pages/accounting/LalurPage'
import TaxPage from './pages/accounting/TaxPage'
import DrePage from './pages/reports/DrePage'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/organization" element={<OrganizationList />} />
          <Route path="/operations/cte" element={<CTeList />} />
          <Route path="/operations/expenses" element={<ExpenseList />} />
          <Route path="/accounting/lalur" element={<LalurPage />} />
          <Route path="/accounting/taxes" element={<TaxPage />} />
          <Route path="/reports/dre" element={<DrePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
