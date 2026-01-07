/* Main App Component - Handles routing */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'

// New ERP Pages
import Index from './pages/Index'
import OrganizationList from './pages/organization/OrganizationList'
import CTeList from './pages/operations/CTeList'
import ExpenseList from './pages/operations/ExpenseList'
import AttachmentCenter from './pages/operations/AttachmentCenter'
import LalurPage from './pages/accounting/LalurPage'
import TaxPage from './pages/accounting/TaxPage'
import DrePage from './pages/reports/DrePage'
import AssetList from './pages/assets/AssetList'
import BankReconciliation from './pages/financial/BankReconciliation'
import TaxReports from './pages/reports/TaxReports'
import CustomDashboard from './pages/reports/CustomDashboard'
import RevenueAnalytics from './pages/reports/RevenueAnalytics'
import FreightDashboard from './pages/reports/FreightDashboard'
import ApprovalsPage from './pages/admin/ApprovalsPage'
import ContractList from './pages/contracts/ContractList'
import IntegrationCenter from './pages/admin/IntegrationCenter'
import CategorizationRules from './pages/admin/CategorizationRules'
import ConditionalValidationRules from './pages/admin/ConditionalValidationRules'
import CteTaxReport from './pages/reports/CteTaxReport'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/organization" element={<OrganizationList />} />
            <Route path="/operations/cte" element={<CTeList />} />
            <Route path="/operations/expenses" element={<ExpenseList />} />
            <Route
              path="/operations/attachments"
              element={<AttachmentCenter />}
            />
            <Route path="/assets/fixed-assets" element={<AssetList />} />
            <Route path="/contracts" element={<ContractList />} />
            <Route
              path="/financial/reconciliation"
              element={<BankReconciliation />}
            />

            {/* Conditional Route Guarding within Protected Area can be done here or inside pages.
                For simplicity we keep them accessible but Sidebar hides them. 
                Strictly, we could wrap them with <ProtectedRoute allowedRoles={['admin']} /> */}
            <Route path="/accounting/lalur" element={<LalurPage />} />
            <Route path="/accounting/taxes" element={<TaxPage />} />

            {/* DRE is sensitive */}
            <Route
              element={<ProtectedRoute allowedRoles={['admin', 'viewer']} />}
            >
              <Route path="/reports/dre" element={<DrePage />} />
            </Route>

            <Route path="/reports/tax" element={<TaxReports />} />
            <Route path="/reports/cte-tax" element={<CteTaxReport />} />
            <Route
              path="/reports/custom-dashboard"
              element={<CustomDashboard />}
            />
            <Route
              path="/reports/revenue-analytics"
              element={<RevenueAnalytics />}
            />
            <Route
              path="/reports/freight-dashboard"
              element={<FreightDashboard />}
            />

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/approvals" element={<ApprovalsPage />} />
              <Route
                path="/admin/integrations"
                element={<IntegrationCenter />}
              />
              <Route
                path="/admin/categorization"
                element={<CategorizationRules />}
              />
              <Route
                path="/admin/conditional-rules"
                element={<ConditionalValidationRules />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
