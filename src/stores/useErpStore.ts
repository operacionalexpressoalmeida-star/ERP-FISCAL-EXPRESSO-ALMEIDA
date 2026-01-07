import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CompanyType = 'Matrix' | 'Branch'
export type UserRole = 'admin' | 'operator' | 'viewer'
export type TransactionStatus = 'pending' | 'approved' | 'rejected'
export type SefazStatus = 'authorized' | 'canceled' | 'denied' | 'unchecked'
export type AssetStatus =
  | 'Active'
  | 'Sold'
  | 'WrittenOff'
  | 'In Maintenance'
  | 'Doc Pending'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

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
  plate?: string
  category: 'Vehicle' | 'Machinery' | 'Equipment' | 'Other'
  acquisitionDate: string
  originalValue: number
  residualValue: number
  usefulLife: number // months
  status: AssetStatus
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  licensingExpiryDate?: string
  insuranceExpiryDate?: string
  averageConsumption?: number
  lastOdometer?: number
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
  autoGenerateExpenses?: boolean
}

export interface Certificate {
  id: string
  name: string
  expiryDate: string
  password?: string
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

export interface CategorizationRule {
  id: string
  field: 'cfop' | 'description' | 'origin' | 'destination'
  operator: 'equals' | 'contains' | 'starts_with'
  value: string
  targetCategory: string
}

export interface ConditionalRule {
  id: string
  name: string
  conditionField: string
  conditionOperator: 'equals' | 'not_equals' | 'contains'
  conditionValue: string
  targetField: string
  ruleType: 'mandatory' | 'match_value'
  ruleValue?: string
  errorMessage: string
}

export interface TransactionDocument {
  id: string
  name: string
  url: string
  type: string
  uploadedAt: string
  signatureStatus?: 'pending' | 'signed'
  signedBy?: string
  signedAt?: string
}

export interface PendencyLog {
  id: string
  timestamp: string
  user: string
  action: string
  details: string
  previousValue?: string
  newValue?: string
}

export interface Transaction {
  id: string
  companyId: string
  type: 'revenue' | 'expense'
  status: TransactionStatus
  date: string
  description: string
  value: number
  origin?: string
  destination?: string
  cteNumber?: string
  accessKey?: string
  category?: string
  cfop?: string
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
  providerName?: string
  documentNumber?: string
  nfseStatus?: 'draft' | 'transmitted' | 'authorized' | 'rejected'
  sefazStatus?: SefazStatus
  consistencyWarnings?: string[]
  rpsNumber?: string
  verificationCode?: string
  serviceCode?: string
  issRate?: number
  issRetained?: boolean
  takerName?: string
  takerCnpj?: string
  ciotCode?: string
  fuelType?: string
  fuelQuantity?: number
  odometer?: number
  relatedTransactionId?: string
  attachmentUrl?: string
  attachmentType?: string
  attachmentName?: string
  attachmentSize?: number
  attachmentIsExternal?: boolean
  attachmentCloudStorage?: boolean
  providerCnpj?: string
  recipientCnpj?: string
  freightId?: string
  freightStatus?: 'Planned' | 'In Transit' | 'Delivered' | 'Cancelled'
  documents?: TransactionDocument[]
  pendencyHistory?: PendencyLog[]
  cteType?: 'Normal' | 'Complementary' | 'Substitution'
  originalCteKey?: string
}

export interface LalurEntry {
  id: string
  companyId: string
  type: 'addition' | 'exclusion'
  description: string
  date: string
  value: number
}

export interface ValidationSettings {
  blockInvalidCfop: boolean
  blockInvalidStates: boolean
  maxValueThreshold: number
  requireFreightId: boolean
  pendingLimitHours: number
}

export interface ErpState {
  isAuthenticated: boolean
  currentUser: User | null
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
  categorizationRules: CategorizationRule[]
  conditionalRules: ConditionalRule[]
  validationSettings: ValidationSettings
  selectedCompanyId: string | 'consolidated'
  userRole: UserRole
  standardCteId: string | null

  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setContext: (companyId: string | 'consolidated') => void
  setUserRole: (role: UserRole) => void
  addCompany: (company: Omit<Company, 'id'>) => void
  updateCompany: (id: string, data: Partial<Omit<Company, 'id'>>) => void
  removeCompany: (id: string) => void
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'status'> & {
      status?: TransactionStatus
    },
  ) => void
  addTransactions: (
    transactions: (Omit<Transaction, 'id' | 'status'> & {
      status?: TransactionStatus
    })[],
  ) => void
  updateTransaction: (
    id: string,
    data: Partial<Omit<Transaction, 'id'>>,
  ) => void
  removeTransaction: (id: string) => void
  validateTransactionsWithSefaz: (ids: string[]) => Promise<void>
  clearExpenses: () => void
  addLalurEntry: (entry: Omit<LalurEntry, 'id'>) => void
  updateLalurEntry: (id: string, data: Partial<Omit<LalurEntry, 'id'>>) => void
  removeLalurEntry: (id: string) => void
  addAsset: (asset: Omit<Asset, 'id'>) => void
  updateAsset: (id: string, data: Partial<Omit<Asset, 'id'>>) => void
  removeAsset: (id: string) => void
  importBankTransactions: (txs: Omit<BankTransaction, 'id'>[]) => void
  reconcileTransaction: (bankTxId: string, sysTxId: string) => void
  requestClosing: (closing: Omit<ClosingPeriod, 'id'>) => void
  approveClosing: (id: string, approverName: string) => void
  rejectClosing: (id: string) => void
  addContract: (contract: Omit<Contract, 'id'>) => void
  updateContract: (id: string, data: Partial<Omit<Contract, 'id'>>) => void
  removeContract: (id: string) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
  checkCertificatesExpiry: () => void
  updateApiConfig: (config: ApiConfig) => void
  syncSefazExpenses: (targetCnpj: string) => Promise<number>
  addCertificate: (cert: Omit<Certificate, 'id'>) => void
  removeCertificate: (id: string) => void
  addIntegrationLog: (log: Omit<IntegrationLog, 'id'>) => void
  addCategorizationRule: (rule: Omit<CategorizationRule, 'id'>) => void
  removeCategorizationRule: (id: string) => void
  updateCategorizationRule: (
    id: string,
    rule: Partial<CategorizationRule>,
  ) => void
  addConditionalRule: (rule: Omit<ConditionalRule, 'id'>) => void
  removeConditionalRule: (id: string) => void
  updateConditionalRule: (id: string, rule: Partial<ConditionalRule>) => void
  updateValidationSettings: (settings: Partial<ValidationSettings>) => void
  checkPendingCtes: () => void
  setStandardCte: (id: string | null) => void
  applyCategorizationRules: (
    transaction: Partial<Transaction>,
  ) => Partial<Transaction>
  getFilteredTransactions: () => Transaction[]
  getFilteredLalurEntries: () => LalurEntry[]
  getFilteredAssets: () => Asset[]
  getFilteredContracts: () => Contract[]
}

const extractPlate = (text: string) => {
  const match = text.match(/[A-Z]{3}-?[0-9][0-9A-Z][0-9]{2}/i)
  return match ? match[0].toUpperCase().replace('-', '') : null
}

const processTransactionLogic = (
  transaction: Omit<Transaction, 'id' | 'status'> & {
    status?: TransactionStatus
  },
  assets: Asset[],
  applyRules: (t: Partial<Transaction>) => Partial<Transaction>,
) => {
  let newTx = {
    ...transaction,
    status: transaction.status || 'approved',
    id: Math.random().toString(36).substring(2, 9),
    isReconciled: false,
    sefazStatus: transaction.sefazStatus || 'unchecked',
    consistencyWarnings: transaction.consistencyWarnings || [],
    attachmentCloudStorage: !!transaction.attachmentUrl,
    documents: transaction.documents || [],
    pendencyHistory: [],
    cteType: transaction.cteType || 'Normal',
  } as Transaction

  // Apply Categorization Rules
  newTx = {
    ...newTx,
    ...applyRules(newTx),
  }

  // Auto-link Asset by Plate
  if (!newTx.assetId && newTx.description) {
    const plate = extractPlate(newTx.description)
    if (plate) {
      const asset = assets.find((a) => a.plate === plate)
      if (asset) newTx.assetId = asset.id
    }
  }

  let updatedAssets = assets
  if (newTx.assetId) {
    updatedAssets = assets.map((asset) => {
      if (asset.id !== newTx.assetId) return asset

      const updates: Partial<Asset> = {}

      if (newTx.category === 'Maintenance') {
        if (newTx.status === 'pending') {
          updates.status = 'In Maintenance'
        } else if (newTx.status === 'approved') {
          updates.lastMaintenanceDate = newTx.date
          updates.status = 'Active'
          const nextDate = new Date(newTx.date)
          nextDate.setMonth(nextDate.getMonth() + 6)
          updates.nextMaintenanceDate = nextDate.toISOString().split('T')[0]
        }
      }

      if (
        newTx.category === 'Fuel' &&
        newTx.odometer &&
        newTx.fuelQuantity &&
        newTx.fuelQuantity > 0
      ) {
        if (asset.lastOdometer && newTx.odometer > asset.lastOdometer) {
          const dist = newTx.odometer - asset.lastOdometer
          const eff = dist / newTx.fuelQuantity
          updates.averageConsumption = asset.averageConsumption
            ? parseFloat(((asset.averageConsumption + eff) / 2).toFixed(2))
            : parseFloat(eff.toFixed(2))
        }
        updates.lastOdometer = newTx.odometer
      }

      return { ...asset, ...updates }
    })
  }

  return { newTx, updatedAssets }
}

export const useErpStore = create<ErpState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      selectedCompanyId: 'consolidated',
      userRole: 'admin',
      standardCteId: null,
      companies: [
        {
          id: 'c1',
          name: 'Expresso Almeida Logística (Matriz)',
          cnpj: '45.123.456/0001-89',
          type: 'Matrix',
          state: 'SP',
          city: 'São Paulo',
        },
      ],
      transactions: [],
      lalurEntries: [],
      assets: [
        {
          id: 'a1',
          companyId: 'c1',
          name: 'Caminhão Volvo FH 540',
          plate: 'ABC1D23',
          category: 'Vehicle',
          acquisitionDate: '2022-01-15',
          originalValue: 850000,
          residualValue: 150000,
          usefulLife: 60,
          status: 'Active',
          lastMaintenanceDate: '2023-12-10',
          nextMaintenanceDate: '2024-06-10',
          licensingExpiryDate: '2024-10-15',
          insuranceExpiryDate: '2024-11-20',
          averageConsumption: 2.4,
          lastOdometer: 150000,
        },
      ],
      bankTransactions: [],
      closingPeriods: [],
      contracts: [],
      notifications: [],
      apiConfigs: [],
      certificates: [],
      integrationLogs: [],
      categorizationRules: [],
      conditionalRules: [],
      validationSettings: {
        blockInvalidCfop: true,
        blockInvalidStates: true,
        maxValueThreshold: 50000,
        requireFreightId: false,
        pendingLimitHours: 48,
      },

      login: async (email, password) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            if (password === '123456') {
              let user: User | null = null
              if (email === 'admin@expressoalmeida.com') {
                user = {
                  id: 'u1',
                  name: 'Administrador',
                  email,
                  role: 'admin',
                  avatar:
                    'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=admin',
                }
              } else if (email === 'operador@expressoalmeida.com') {
                user = {
                  id: 'u2',
                  name: 'Operador',
                  email,
                  role: 'operator',
                  avatar:
                    'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=operator',
                }
              }
              if (user) {
                set({
                  isAuthenticated: true,
                  currentUser: user,
                  userRole: user.role,
                })
                resolve(true)
                return
              }
            }
            resolve(false)
          }, 800)
        })
      },

      logout: () => {
        set({
          isAuthenticated: false,
          currentUser: null,
          userRole: 'viewer',
        })
      },

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
        set((state) => {
          const { newTx, updatedAssets } = processTransactionLogic(
            transaction,
            state.assets,
            get().applyCategorizationRules,
          )

          return {
            transactions: [...state.transactions, newTx],
            assets: updatedAssets,
            notifications: [
              ...state.notifications,
              {
                id: Math.random().toString(36).substring(2, 9),
                title: 'Nova Movimentação',
                message: `Registro ${newTx.type === 'revenue' ? 'Receita' : 'Despesa'} de ${newTx.value} adicionado.`,
                type: 'info',
                date: new Date().toISOString(),
                read: false,
              },
            ],
          }
        }),

      addTransactions: (transactions) =>
        set((state) => {
          let currentAssets = [...state.assets]
          const newTxs: Transaction[] = []

          transactions.forEach((tx) => {
            const result = processTransactionLogic(
              tx,
              currentAssets,
              get().applyCategorizationRules,
            )
            newTxs.push(result.newTx)
            currentAssets = result.updatedAssets
          })

          const notification = {
            id: Math.random().toString(36).substring(2, 9),
            title: 'Importação em Massa',
            message: `${newTxs.length} registros foram adicionados com sucesso.`,
            type: 'success' as const,
            date: new Date().toISOString(),
            read: false,
          }

          return {
            transactions: [...state.transactions, ...newTxs],
            assets: currentAssets,
            notifications: [notification, ...state.notifications],
          }
        }),

      updateTransaction: (id, data) =>
        set((state) => {
          const oldTx = state.transactions.find((t) => t.id === id)
          if (!oldTx) return state

          const updatedTx = { ...oldTx, ...data }
          let updatedAssets = state.assets

          if (
            updatedTx.assetId &&
            updatedTx.category === 'Maintenance' &&
            oldTx.status !== updatedTx.status
          ) {
            updatedAssets = state.assets.map((asset) => {
              if (asset.id !== updatedTx.assetId) return asset
              const updates: Partial<Asset> = {}
              if (updatedTx.status === 'approved') {
                updates.lastMaintenanceDate = updatedTx.date
                updates.status = 'Active'
                const nextDate = new Date(updatedTx.date)
                nextDate.setMonth(nextDate.getMonth() + 6)
                updates.nextMaintenanceDate = nextDate
                  .toISOString()
                  .split('T')[0]
              } else if (updatedTx.status === 'rejected') {
                if (asset.status === 'In Maintenance') {
                  updates.status = 'Active'
                }
              }
              return { ...asset, ...updates }
            })
          }

          return {
            transactions: state.transactions.map((t) =>
              t.id === id ? updatedTx : t,
            ),
            assets: updatedAssets,
          }
        }),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      validateTransactionsWithSefaz: async (ids) => {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        set((state) => ({
          transactions: state.transactions.map((t) => {
            if (ids.includes(t.id)) {
              const statuses: SefazStatus[] = [
                'authorized',
                'authorized',
                'authorized',
                'canceled',
              ]
              const randomStatus =
                statuses[Math.floor(Math.random() * statuses.length)]
              return { ...t, sefazStatus: randomStatus }
            }
            return t
          }),
        }))
      },

      clearExpenses: () =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.type !== 'expense'),
          notifications: [
            ...state.notifications,
            {
              id: Math.random().toString(36).substring(2, 9),
              title: 'Módulo Resetado',
              message: 'Todas as despesas foram removidas do sistema.',
              type: 'warning',
              date: new Date().toISOString(),
              read: false,
            },
          ],
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

      checkCertificatesExpiry: () =>
        set((state) => {
          const today = new Date()
          const newNotifications: Notification[] = []
          state.certificates.forEach((cert) => {
            const expiry = new Date(cert.expiryDate)
            const diffTime = expiry.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays <= 30 && diffDays >= 0) {
              const alertId = `cert-exp-${cert.id}-${diffDays}`
              if (!state.notifications.some((n) => n.id === alertId)) {
                newNotifications.push({
                  id: alertId,
                  title: 'Certificado Expirando',
                  message: `Certificado ${cert.name} vence em ${diffDays} dias.`,
                  type: 'error',
                  date: new Date().toISOString(),
                  read: false,
                })
              }
            }
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

      syncSefazExpenses: async (targetCnpj) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return 0
      },

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
            { ...log, id: Math.random().toString(36).substring(2, 9) },
            ...state.integrationLogs,
          ].slice(0, 100),
        })),

      addCategorizationRule: (rule) =>
        set((state) => ({
          categorizationRules: [
            ...state.categorizationRules,
            { ...rule, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      removeCategorizationRule: (id) =>
        set((state) => ({
          categorizationRules: state.categorizationRules.filter(
            (r) => r.id !== id,
          ),
        })),

      updateCategorizationRule: (id, rule) =>
        set((state) => ({
          categorizationRules: state.categorizationRules.map((r) =>
            r.id === id ? { ...r, ...rule } : r,
          ),
        })),

      addConditionalRule: (rule) =>
        set((state) => ({
          conditionalRules: [
            ...state.conditionalRules,
            { ...rule, id: Math.random().toString(36).substring(2, 9) },
          ],
        })),

      removeConditionalRule: (id) =>
        set((state) => ({
          conditionalRules: state.conditionalRules.filter((r) => r.id !== id),
        })),

      updateConditionalRule: (id, rule) =>
        set((state) => ({
          conditionalRules: state.conditionalRules.map((r) =>
            r.id === id ? { ...r, ...rule } : r,
          ),
        })),

      updateValidationSettings: (settings) =>
        set((state) => ({
          validationSettings: { ...state.validationSettings, ...settings },
        })),

      checkPendingCtes: () =>
        set((state) => {
          const limitHours = state.validationSettings.pendingLimitHours || 48
          const now = new Date()
          const newNotifications: Notification[] = []

          state.transactions.forEach((t) => {
            if (t.status === 'pending') {
              const date = new Date(t.date)
              const diffTime = Math.abs(now.getTime() - date.getTime())
              const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))

              if (diffHours > limitHours) {
                const alertId = `pending-cte-${t.id}`
                if (!state.notifications.some((n) => n.id === alertId)) {
                  newNotifications.push({
                    id: alertId,
                    title: 'CT-e Pendente Expirado',
                    message: `O CT-e ${t.cteNumber} está pendente há mais de ${limitHours} horas.`,
                    type: 'error',
                    date: new Date().toISOString(),
                    read: false,
                  })
                }
              }
            }
          })

          if (newNotifications.length > 0) {
            return {
              notifications: [...newNotifications, ...state.notifications],
            }
          }
          return {}
        }),

      setStandardCte: (id) => set({ standardCteId: id }),

      applyCategorizationRules: (transaction) => {
        const rules = get().categorizationRules
        if (!rules) return {}
        for (const rule of rules) {
          const fieldValue =
            transaction[rule.field as keyof Partial<Transaction>]
          if (!fieldValue) continue
          const val = String(fieldValue).toLowerCase()
          const ruleVal = rule.value.toLowerCase()
          let matched = false
          if (rule.operator === 'equals' && val === ruleVal) matched = true
          if (rule.operator === 'contains' && val.includes(ruleVal))
            matched = true
          if (rule.operator === 'starts_with' && val.startsWith(ruleVal))
            matched = true
          if (matched) return { category: rule.targetCategory }
        }
        return {}
      },

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
