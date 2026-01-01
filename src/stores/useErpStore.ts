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

export interface Asset {
  id: string
  companyId: string
  name: string
  category: 'Vehicle' | 'Machinery' | 'Equipment' | 'Other'
  acquisitionDate: string
  originalValue: number
  residualValue: number
  depreciationRate: number // % per year
  status: 'Active' | 'Sold' | 'WrittenOff'
}

export interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  isReconciled: boolean
  reconciledTransactionId?: string
}

export interface ClosingPeriod {
  id: string
  companyId: string
  month: number
  year: number
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  approvedBy?: string
  approvedAt?: string
}

export interface Contract {
  id: string
  companyId: string
  partyName: string
  partyRole: 'Customer' | 'Supplier'
  type: 'Service' | 'Transport' | 'Lease'
  startDate: string
  endDate: string
  value: number
  status: 'Active' | 'Expired' | 'Draft'
  terms: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  date: string
  read: boolean
}

export interface ApiConfig {
  id: string
  serviceName: string
  endpoint: string
  apiKey: string
  isActive: boolean
  lastSync?: string
  type?: 'tracking' | 'fiscal' | 'payment'
  environment?: 'homologation' | 'production'
  certificateId?: string
  provider?: string
}

export interface Certificate {
  id: string
  name: string
  expiryDate: string
  password?: string // Mock storage
  issuer: string
  status: 'valid' | 'expired' | 'expiring_soon'
}

export interface IntegrationLog {
  id: string
  type: 'SEFAZ' | 'CIOT' | 'TRACKING'
  action: string
  status: 'success' | 'error' | 'pending'
  message: string
  timestamp: string
  details?: string
}

export interface Transaction {
  id: string
  companyId: string
  type: 'revenue' | 'expense'
  date: string
  description: string
  value: number
  origin?: string
  destination?: string
  cteNumber?: string
  category?: string
  isDeductibleIrpjCsll?: boolean
  hasCreditPisCofins?: boolean
  hasCreditIcms?: boolean
  icmsValue: number
  pisValue: number
  cofinsValue: number
  issValue?: number
  assetId?: string
  contractId?: string
  isReconciled?: boolean
  // NFS-e fields
  nfseStatus?: 'draft' | 'transmitted' | 'authorized' | 'rejected'
  rpsNumber?: string
  verificationCode?: string
  serviceCode?: string
  issRate?: number
  issRetained?: boolean
  takerName?: string
  takerCnpj?: string
  // CIOT fields
  ciotCode?: string
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
  assets: Asset[]
  bankTransactions: BankTransaction[]
  closingPeriods: ClosingPeriod[]
  contracts: Contract[]
  notifications: Notification[]
  apiConfigs: ApiConfig[]
  certificates: Certificate[]
  integrationLogs: IntegrationLog[]
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

  // Asset Actions
  addAsset: (asset: Omit<Asset, 'id'>) => void
  updateAsset: (id: string, data: Partial<Omit<Asset, 'id'>>) => void
  removeAsset: (id: string) => void

  // Bank Actions
  importBankTransactions: (txs: Omit<BankTransaction, 'id'>[]) => void
  reconcileTransaction: (bankTxId: string, sysTxId: string) => void

  // Closing Actions
  requestClosing: (closing: Omit<ClosingPeriod, 'id'>) => void
  approveClosing: (id: string, approverName: string) => void
  rejectClosing: (id: string) => void

  // Contract Actions
  addContract: (contract: Omit<Contract, 'id'>) => void
  updateContract: (id: string, data: Partial<Omit<Contract, 'id'>>) => void
  removeContract: (id: string) => void

  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
  checkCertificatesExpiry: () => void

  // Api Config Actions
  updateApiConfig: (config: ApiConfig) => void

  // Certificate Actions
  addCertificate: (cert: Omit<Certificate, 'id'>) => void
  removeCertificate: (id: string) => void

  // Log Actions
  addIntegrationLog: (log: Omit<IntegrationLog, 'id'>) => void

  // Getters
  getFilteredTransactions: () => Transaction[]
  getFilteredLalurEntries: () => LalurEntry[]
  getFilteredAssets: () => Asset[]
  getFilteredContracts: () => Contract[]
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
          icmsValue: 1440,
          pisValue: 198,
          cofinsValue: 912,
          isReconciled: false,
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
          icmsValue: 630,
          pisValue: 57.75,
          cofinsValue: 266,
          isReconciled: false,
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
          isReconciled: false,
        },
      ],
      lalurEntries: [],
      assets: [
        {
          id: 'a1',
          companyId: 'c1',
          name: 'Caminhão Volvo FH 540',
          category: 'Vehicle',
          acquisitionDate: '2022-01-15',
          originalValue: 850000,
          residualValue: 150000,
          depreciationRate: 15,
          status: 'Active',
        },
      ],
      bankTransactions: [],
      closingPeriods: [],
      contracts: [
        {
          id: 'cnt1',
          companyId: 'c1',
          partyName: 'Indústrias Metalúrgicas Ltda',
          partyRole: 'Customer',
          type: 'Transport',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 120000,
          status: 'Active',
          terms: 'Pagamento 30 dias após emissão CT-e',
        },
      ],
      notifications: [
        {
          id: 'n1',
          title: 'Alerta de Manutenção',
          message: 'Veículo Volvo FH 540 requer revisão em 5 dias.',
          type: 'warning',
          date: new Date().toISOString(),
          read: false,
        },
      ],
      apiConfigs: [
        {
          id: 'api_omni',
          serviceName: 'Omnilink Rastreamento',
          endpoint: 'https://api.omnilink.com.br/v1',
          apiKey: '****************',
          isActive: true,
          lastSync: new Date().toISOString(),
          type: 'tracking',
        },
        {
          id: 'api_sefaz',
          serviceName: 'SEFAZ Nacional (NFS-e)',
          endpoint: 'https://homologacao.sefaz.sp.gov.br/ws',
          apiKey: '',
          isActive: true,
          type: 'fiscal',
          environment: 'homologation',
          certificateId: 'cert1',
        },
        {
          id: 'api_ciot',
          serviceName: 'Integração CIOT',
          endpoint: 'https://api.efrete.com.br/v1',
          apiKey: '****************',
          isActive: true,
          type: 'payment',
          provider: 'e-Frete',
        },
      ],
      certificates: [
        {
          id: 'cert1',
          name: 'EXPRESSO ALMEIDA LOGISTICA LTDA',
          expiryDate: '2025-12-31',
          issuer: 'Certisign',
          status: 'valid',
        },
      ],
      integrationLogs: [],

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
            {
              ...transaction,
              id: Math.random().toString(36).substring(2, 9),
              isReconciled: false,
            },
          ],
          notifications: [
            ...state.notifications,
            {
              id: Math.random().toString(36).substring(2, 9),
              title: 'Nova Movimentação',
              message: `Registro ${transaction.type === 'revenue' ? 'Receita' : 'Despesa'} de ${transaction.value} adicionado.`,
              type: 'info',
              date: new Date().toISOString(),
              read: false,
            },
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

      addAsset: (asset) =>
        set((state) => ({
          assets: [
            ...state.assets,
            { ...asset, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      updateAsset: (id, data) =>
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, ...data } : a,
          ),
        })),

      removeAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        })),

      importBankTransactions: (txs) =>
        set((state) => ({
          bankTransactions: [
            ...state.bankTransactions,
            ...txs.map((t) => ({
              ...t,
              id: Math.random().toString(36).substring(2, 9),
              isReconciled: false,
            })),
          ],
        })),

      reconcileTransaction: (bankTxId, sysTxId) =>
        set((state) => ({
          bankTransactions: state.bankTransactions.map((bt) =>
            bt.id === bankTxId
              ? { ...bt, isReconciled: true, reconciledTransactionId: sysTxId }
              : bt,
          ),
          transactions: state.transactions.map((t) =>
            t.id === sysTxId ? { ...t, isReconciled: true } : t,
          ),
        })),

      requestClosing: (closing) =>
        set((state) => ({
          closingPeriods: [
            ...state.closingPeriods,
            {
              ...closing,
              id: Math.random().toString(36).substring(2, 9),
              status: 'pending',
            },
          ],
          notifications: [
            ...state.notifications,
            {
              id: Math.random().toString(36).substring(2, 9),
              title: 'Aprovação Necessária',
              message: `Fechamento ${closing.month}/${closing.year} pendente.`,
              type: 'warning',
              date: new Date().toISOString(),
              read: false,
            },
          ],
        })),

      approveClosing: (id, approverName) =>
        set((state) => ({
          closingPeriods: state.closingPeriods.map((cp) =>
            cp.id === id
              ? {
                  ...cp,
                  status: 'approved',
                  approvedBy: approverName,
                  approvedAt: new Date().toISOString(),
                }
              : cp,
          ),
        })),

      rejectClosing: (id) =>
        set((state) => ({
          closingPeriods: state.closingPeriods.map((cp) =>
            cp.id === id ? { ...cp, status: 'rejected' } : cp,
          ),
        })),

      addContract: (contract) =>
        set((state) => ({
          contracts: [
            ...state.contracts,
            { ...contract, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      updateContract: (id, data) =>
        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        })),

      removeContract: (id) =>
        set((state) => ({
          contracts: state.contracts.filter((c) => c.id !== id),
        })),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substring(2, 9),
              read: false,
            },
            ...state.notifications,
          ],
        })),

      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Check certificates and add notifications if expiring
      checkCertificatesExpiry: () =>
        set((state) => {
          const today = new Date()
          const newNotifications: Notification[] = []

          state.certificates.forEach((cert) => {
            const expiry = new Date(cert.expiryDate)
            const diffTime = expiry.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            const createAlert = (days: number) => {
              const alertId = `cert-exp-${cert.id}-${days}`
              // Avoid duplicate alerts for the same threshold
              if (!state.notifications.some((n) => n.id === alertId)) {
                newNotifications.push({
                  id: alertId,
                  title: 'Certificado Expirando',
                  message: `O certificado ${cert.name} vence em ${days} dias.`,
                  type: 'error',
                  date: new Date().toISOString(),
                  read: false,
                })
              }
            }

            if (diffDays <= 30 && diffDays > 15) createAlert(30)
            else if (diffDays <= 15 && diffDays > 7) createAlert(15)
            else if (diffDays <= 7 && diffDays >= 0) createAlert(7)
          })

          if (newNotifications.length > 0) {
            return {
              notifications: [...newNotifications, ...state.notifications],
            }
          }
          return {}
        }),

      updateApiConfig: (config) =>
        set((state) => {
          const exists = state.apiConfigs.find((c) => c.id === config.id)
          if (exists) {
            return {
              apiConfigs: state.apiConfigs.map((c) =>
                c.id === config.id ? config : c,
              ),
            }
          }
          return {
            apiConfigs: [...state.apiConfigs, config],
          }
        }),

      addCertificate: (cert) =>
        set((state) => ({
          certificates: [
            ...state.certificates,
            { ...cert, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      removeCertificate: (id) =>
        set((state) => ({
          certificates: state.certificates.filter((c) => c.id !== id),
        })),

      addIntegrationLog: (log) =>
        set((state) => ({
          integrationLogs: [
            {
              ...log,
              id: Math.random().toString(36).substring(2, 9),
            },
            ...state.integrationLogs,
          ].slice(0, 100),
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

      getFilteredAssets: () => {
        const { assets, selectedCompanyId } = get()
        if (selectedCompanyId === 'consolidated') return assets
        return assets.filter((a) => a.companyId === selectedCompanyId)
      },

      getFilteredContracts: () => {
        const { contracts, selectedCompanyId } = get()
        if (selectedCompanyId === 'consolidated') return contracts
        return contracts.filter((c) => c.companyId === selectedCompanyId)
      },
    }),
    { name: 'erp-store-v3' },
  ),
)
