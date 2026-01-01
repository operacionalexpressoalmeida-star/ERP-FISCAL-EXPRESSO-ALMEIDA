import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CompanyType = 'Matrix' | 'Branch'
export type UserRole = 'admin' | 'operator' | 'viewer'

export interface Company {
  id: string
  name: string
  cnpj: string
  type: CompanyType
  parentId?: string
  state: string
  city: string
}

export interface Transaction {
  id: string
  companyId: string
  type: 'revenue' | 'expense'
  date: string
  description: string
  value: number
  // Revenue specific
  origin?: string
  destination?: string
  cteNumber?: string
  // Expense specific
  category?: string
  isDeductibleIrpjCsll?: boolean
  hasCreditPisCofins?: boolean
  hasCreditIcms?: boolean
  // Tax values (calculated or manual)
  icmsValue: number
  pisValue: number
  cofinsValue: number
  issValue?: number
}

export interface LalurEntry {
  id: string
  companyId: string
  type: 'addition' | 'exclusion'
  description: string
  date: string
  value: number
}

export interface ErpState {
  companies: Company[]
  transactions: Transaction[]
  lalurEntries: LalurEntry[]
  selectedCompanyId: string | 'consolidated'
  userRole: UserRole

  // Actions
  setContext: (companyId: string | 'consolidated') => void
  setUserRole: (role: UserRole) => void
  addCompany: (company: Omit<Company, 'id'>) => void
  updateCompany: (id: string, data: Partial<Omit<Company, 'id'>>) => void
  removeCompany: (id: string) => void
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  updateTransaction: (
    id: string,
    data: Partial<Omit<Transaction, 'id'>>,
  ) => void
  removeTransaction: (id: string) => void
  addLalurEntry: (entry: Omit<LalurEntry, 'id'>) => void
  updateLalurEntry: (id: string, data: Partial<Omit<LalurEntry, 'id'>>) => void
  removeLalurEntry: (id: string) => void

  // Getters (Selectors usually used in components, but helpers here)
  getFilteredTransactions: () => Transaction[]
  getFilteredLalurEntries: () => LalurEntry[]
}

export const useErpStore = create<ErpState>()(
  persist(
    (set, get) => ({
      selectedCompanyId: 'consolidated',
      userRole: 'admin',
      companies: [
        {
          id: 'c1',
          name: 'Transportes Global SA (Matriz)',
          cnpj: '12.345.678/0001-90',
          type: 'Matrix',
          state: 'SP',
          city: 'São Paulo',
        },
        {
          id: 'c2',
          name: 'Transportes Global Filial RJ',
          cnpj: '12.345.678/0002-71',
          type: 'Branch',
          parentId: 'c1',
          state: 'RJ',
          city: 'Rio de Janeiro',
        },
        {
          id: 'c3',
          name: 'Transportes Global Filial MG',
          cnpj: '12.345.678/0003-52',
          type: 'Branch',
          parentId: 'c1',
          state: 'MG',
          city: 'Belo Horizonte',
        },
      ],
      transactions: [
        // Mock Revenue
        {
          id: 't1',
          companyId: 'c1',
          type: 'revenue',
          date: '2024-01-10',
          description: 'Frete SP-RJ',
          value: 5000,
          cteNumber: '1001',
          origin: 'SP',
          destination: 'RJ',
          icmsValue: 600,
          pisValue: 82.5,
          cofinsValue: 380,
        },
        {
          id: 't2',
          companyId: 'c2',
          type: 'revenue',
          date: '2024-01-12',
          description: 'Frete RJ-SP',
          value: 4500,
          cteNumber: '2001',
          origin: 'RJ',
          destination: 'SP',
          icmsValue: 540,
          pisValue: 74.25,
          cofinsValue: 342,
        },
        // Mock Expenses
        {
          id: 'e1',
          companyId: 'c1',
          type: 'expense',
          date: '2024-01-05',
          description: 'Combustível',
          value: 2000,
          category: 'Fuel',
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: true,
          hasCreditIcms: true,
          icmsValue: 240,
          pisValue: 33,
          cofinsValue: 152,
        },
        {
          id: 'e2',
          companyId: 'c1',
          type: 'expense',
          date: '2024-01-15',
          description: 'Manutenção',
          value: 1500,
          category: 'Maintenance',
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: true,
          hasCreditIcms: false,
          icmsValue: 0,
          pisValue: 24.75,
          cofinsValue: 114,
        },
        {
          id: 'e3',
          companyId: 'c1',
          type: 'expense',
          date: '2024-01-20',
          description: 'Multa de Trânsito',
          value: 500,
          category: 'Administrative',
          isDeductibleIrpjCsll: false,
          hasCreditPisCofins: false,
          hasCreditIcms: false,
          icmsValue: 0,
          pisValue: 0,
          cofinsValue: 0,
        },
      ],
      lalurEntries: [
        {
          id: 'l1',
          companyId: 'c1',
          type: 'addition',
          description: 'Multas Indedutíveis',
          date: '2024-01-31',
          value: 500,
        },
      ],

      setContext: (id) => set({ selectedCompanyId: id }),
      setUserRole: (role) => set({ userRole: role }),

      addCompany: (company) =>
        set((state) => ({
          companies: [
            ...state.companies,
            { ...company, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      updateCompany: (id, data) =>
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        })),

      removeCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
        })),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...transaction, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      updateTransaction: (id, data) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t,
          ),
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      addLalurEntry: (entry) =>
        set((state) => ({
          lalurEntries: [
            ...state.lalurEntries,
            { ...entry, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      updateLalurEntry: (id, data) =>
        set((state) => ({
          lalurEntries: state.lalurEntries.map((e) =>
            e.id === id ? { ...e, ...data } : e,
          ),
        })),

      removeLalurEntry: (id) =>
        set((state) => ({
          lalurEntries: state.lalurEntries.filter((e) => e.id !== id),
        })),

      getFilteredTransactions: () => {
        const { transactions, selectedCompanyId } = get()
        if (selectedCompanyId === 'consolidated') return transactions
        return transactions.filter((t) => t.companyId === selectedCompanyId)
      },

      getFilteredLalurEntries: () => {
        const { lalurEntries, selectedCompanyId } = get()
        if (selectedCompanyId === 'consolidated') return lalurEntries
        return lalurEntries.filter((e) => e.companyId === selectedCompanyId)
      },
    }),
    { name: 'erp-store-v1' },
  ),
)
