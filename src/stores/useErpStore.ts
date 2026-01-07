import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CompanyType = 'Matrix' | 'Branch'
export type UserRole = 'admin' | 'operator' | 'viewer'
export type TransactionStatus = 'pending' | 'approved' | 'rejected'
export type AssetStatus =
  | 'Active'
  | 'Sold'
  | 'WrittenOff'
  | 'In Maintenance'
  | 'Doc Pending'

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
  depreciationRate: number // % per year
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
  updateTransaction: (
    id: string,
    data: Partial<Omit<Transaction, 'id'>>,
  ) => void
  removeTransaction: (id: string) => void
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
  getFilteredTransactions: () => Transaction[]
  getFilteredLalurEntries: () => LalurEntry[]
  getFilteredAssets: () => Asset[]
  getFilteredContracts: () => Contract[]
}

const extractPlate = (text: string) => {
  // Matches ABC1234 or ABC1D23
  const match = text.match(/[A-Z]{3}-?[0-9][0-9A-Z][0-9]{2}/i)
  return match ? match[0].toUpperCase().replace('-', '') : null
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
          depreciationRate: 15,
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
      apiConfigs: [
        {
          id: 'api_sefaz',
          serviceName: 'SEFAZ Nacional (NFS-e)',
          endpoint: 'https://homologacao.sefaz.sp.gov.br/ws',
          apiKey: '',
          isActive: true,
          type: 'fiscal',
          environment: 'homologation',
          certificateId: 'cert1',
          autoGenerateExpenses: true,
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
        set((state) => {
          const newTx = {
            ...transaction,
            status: transaction.status || 'approved',
            id: Math.random().toString(36).substring(2, 9),
            isReconciled: false,
          }

          // Auto-link Asset by Plate
          if (!newTx.assetId && newTx.description) {
            const plate = extractPlate(newTx.description)
            if (plate) {
              const asset = state.assets.find((a) => a.plate === plate)
              if (asset) newTx.assetId = asset.id
            }
          }

          let updatedAssets = state.assets
          // Process Asset Updates
          if (newTx.assetId) {
            updatedAssets = state.assets.map((asset) => {
              if (asset.id !== newTx.assetId) return asset

              const updates: Partial<Asset> = {}

              // Maintenance Logic
              if (newTx.category === 'Maintenance') {
                if (newTx.status === 'pending') {
                  updates.status = 'In Maintenance'
                } else if (newTx.status === 'approved') {
                  updates.lastMaintenanceDate = newTx.date
                  updates.status = 'Active'
                  const nextDate = new Date(newTx.date)
                  nextDate.setMonth(nextDate.getMonth() + 6)
                  updates.nextMaintenanceDate = nextDate
                    .toISOString()
                    .split('T')[0]
                }
              }

              // Fuel Logic
              if (
                newTx.category === 'Fuel' &&
                newTx.odometer &&
                newTx.fuelQuantity
              ) {
                if (asset.lastOdometer && newTx.odometer > asset.lastOdometer) {
                  const dist = newTx.odometer - asset.lastOdometer
                  const eff = dist / newTx.fuelQuantity
                  // Moving average calculation
                  updates.averageConsumption = asset.averageConsumption
                    ? parseFloat(
                        ((asset.averageConsumption + eff) / 2).toFixed(2),
                      )
                    : parseFloat(eff.toFixed(2))
                }
                updates.lastOdometer = newTx.odometer
              }

              return { ...asset, ...updates }
            })
          }

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

      updateTransaction: (id, data) =>
        set((state) => {
          const oldTx = state.transactions.find((t) => t.id === id)
          if (!oldTx) return state

          const updatedTx = { ...oldTx, ...data }
          let updatedAssets = state.assets

          // Handle Maintenance Approval/Rejection effects on Asset
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
                // If rejected, remove "In Maintenance" status if it was set
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

          // Check Certificates
          state.certificates.forEach((cert) => {
            const expiry = new Date(cert.expiryDate)
            const diffTime = expiry.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            const createAlert = (days: number) => {
              const alertId = `cert-exp-${cert.id}-${days}`
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

          // Check Asset Documents
          let updatedAssets = state.assets
          let assetsChanged = false

          updatedAssets = state.assets.map((asset) => {
            let status = asset.status
            const checks = [
              { date: asset.licensingExpiryDate, type: 'Licenciamento' },
              { date: asset.insuranceExpiryDate, type: 'Seguro' },
            ]

            let hasExpired = false

            checks.forEach((check) => {
              if (check.date) {
                const expiry = new Date(check.date)
                const diffTime = expiry.getTime() - today.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (diffDays < 0) hasExpired = true

                if (diffDays <= 30 && diffDays >= 0) {
                  const alertId = `asset-${asset.id}-${check.type}-exp`
                  if (!state.notifications.some((n) => n.id === alertId)) {
                    newNotifications.push({
                      id: alertId,
                      title: `Documento Vencendo`,
                      message: `${check.type} do ativo ${asset.plate || asset.name} vence em ${diffDays} dias.`,
                      type: 'warning',
                      date: new Date().toISOString(),
                      read: false,
                    })
                  }
                }
              }
            })

            if (hasExpired && status !== 'Doc Pending') {
              status = 'Doc Pending'
              assetsChanged = true
            }
            return { ...asset, status }
          })

          if (newNotifications.length > 0 || assetsChanged) {
            return {
              notifications: [...newNotifications, ...state.notifications],
              assets: assetsChanged ? updatedAssets : state.assets,
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
        const { transactions, apiConfigs, assets } = get()
        const sefazConfig = apiConfigs.find((c) => c.type === 'fiscal')

        if (!sefazConfig?.isActive) {
          throw new Error('Integração SEFAZ inativa.')
        }

        await new Promise((resolve) => setTimeout(resolve, 1500))

        const newExpenses: Transaction[] = []
        const today = new Date().toISOString().split('T')[0]

        // Helper for smart categorization
        const categorize = (desc: string) => {
          const d = desc.toLowerCase()
          if (
            d.includes('diesel') ||
            d.includes('gasolina') ||
            d.includes('etanol')
          )
            return 'Fuel'
          if (
            d.includes('manutencao') ||
            d.includes('revisao') ||
            d.includes('pneu') ||
            d.includes('servico')
          )
            return 'Maintenance'
          if (d.includes('pedagio') || d.includes('pedágio')) return 'Tolls'
          return 'Uncategorized'
        }

        // Mock Fuel Invoice with Plate
        const fuelDoc = '550' + Math.floor(Math.random() * 1000)
        if (!transactions.some((t) => t.documentNumber === fuelDoc)) {
          // Use a plate from existing assets to demonstrate linking
          const demoPlate = assets[0]?.plate || 'ABC1D23'
          const desc = `Abastecimento Diesel S10 - Placa ${demoPlate}`
          const cat = categorize(desc)
          newExpenses.push({
            id: Math.random().toString(36).substring(2, 9),
            companyId: 'c1',
            type: 'expense',
            status: 'pending',
            date: today,
            description: desc,
            providerName: 'Posto Rede VIP',
            documentNumber: fuelDoc,
            value: 1250.0,
            category: cat,
            isDeductibleIrpjCsll: true,
            hasCreditPisCofins: true,
            hasCreditIcms: true,
            icmsValue: 150,
            pisValue: 20.62,
            cofinsValue: 95.0,
            isReconciled: false,
            takerCnpj: targetCnpj,
            fuelType: 'Diesel S10',
            fuelQuantity: 200,
            odometer: (assets[0]?.lastOdometer || 150000) + 500, // Simulate progress
          })
        }

        if (newExpenses.length > 0) {
          // We call addTransaction for each to trigger the store logic (linking)
          // But addTransaction updates state directly, so we need to be careful inside the loop
          // Actually, we can just return the count and let the caller handle UI,
          // but we need to update state.
          // Since `syncSefazExpenses` is inside the store, we can update state directly.
          // But to reuse logic of `addTransaction`, we should manually invoke similar logic.
          // For simplicity, let's just append to transactions and run linking logic here.

          let updatedAssets = assets

          newExpenses.forEach((tx) => {
            // Auto-link
            if (!tx.assetId && tx.description) {
              const plate = extractPlate(tx.description)
              if (plate) {
                const asset = updatedAssets.find((a) => a.plate === plate)
                if (asset) tx.assetId = asset.id
              }
            }
            // Logic for auto updates (e.g. status) is normally on 'addTransaction'.
            // For now, let's assume they come as pending and no immediate asset update is needed
            // until approval, EXCEPT for status 'In Maintenance' if pending maintenance.
            if (tx.category === 'Maintenance' && tx.status === 'pending') {
              if (tx.assetId) {
                updatedAssets = updatedAssets.map((a) =>
                  a.id === tx.assetId ? { ...a, status: 'In Maintenance' } : a,
                )
              }
            }
          })

          set((state) => ({
            transactions: [...state.transactions, ...newExpenses],
            assets: updatedAssets,
            integrationLogs: [
              {
                id: Math.random().toString(36).substring(2, 9),
                type: 'SEFAZ',
                action: 'Sync Automático Despesas',
                status: 'success',
                message: `${newExpenses.length} documentos fiscais importados para o CNPJ ${targetCnpj}`,
                timestamp: new Date().toISOString(),
              },
              ...state.integrationLogs,
            ],
            notifications: [
              ...state.notifications,
              {
                id: Math.random().toString(36).substring(2, 9),
                title: 'Despesas Importadas',
                message: `${newExpenses.length} novas despesas aguardando aprovação.`,
                type: 'warning',
                date: new Date().toISOString(),
                read: false,
              },
            ],
          }))
        }

        return newExpenses.length
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
