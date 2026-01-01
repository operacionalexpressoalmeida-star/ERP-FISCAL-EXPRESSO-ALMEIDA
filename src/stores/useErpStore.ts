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
          name: 'Expresso Almeida Logística (Matriz)',
          cnpj: '45.123.456/0001-89',
          type: 'Matrix',
          state: 'SP',
          city: 'São Paulo',
        },
        {
          id: 'c2',
          name: 'Expresso Almeida Filial Sul',
          cnpj: '45.123.456/0002-60',
          type: 'Branch',
          parentId: 'c1',
          state: 'PR',
          city: 'Curitiba',
        },
        {
          id: 'c3',
          name: 'Expresso Almeida Filial Nordeste',
          cnpj: '45.123.456/0003-40',
          type: 'Branch',
          parentId: 'c1',
          state: 'BA',
          city: 'Salvador',
        },
      ],
      transactions: [
        {
          id: 't1',
          companyId: 'c1',
          type: 'revenue',
          date: '2024-02-10',
          description: 'Transporte Carga Pesada SP-PR',
          value: 12000,
          cteNumber: '5501',
          origin: 'SP',
          destination: 'PR',
          icmsValue: 1440, // 12%
          pisValue: 198,
          cofinsValue: 912,
        },
        {
          id: 't2',
          companyId: 'c1',
          type: 'revenue',
          date: '2024-02-11',
          description: 'Entrega Expressa SP-SP',
          value: 3500,
          cteNumber: '5502',
          origin: 'SP',
          destination: 'SP',
          icmsValue: 630, // 18%
          pisValue: 57.75,
          cofinsValue: 266,
        },
        {
          id: 'e1',
          companyId: 'c1',
          type: 'expense',
          date: '2024-02-05',
          description: 'Diesel S10',
          value: 4500,
          category: 'Fuel',
          isDeductibleIrpjCsll: true,
          hasCreditPisCofins: true,
          hasCreditIcms: true,
          icmsValue: 540,
          pisValue: 74.25,
          cofinsValue: 342,
        },
      ],
      lalurEntries: [],

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
    { name: 'erp-store-v2' },
  ),
)
