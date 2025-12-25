import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Load = {
  id: string
  requestNumber: string
  cargoValue: number
  associatedValue: number
  responsibleId: string
  createdAt: string
}

export type Responsible = {
  id: string
  name: string
}

type CargoState = {
  loads: Load[]
  responsibles: Responsible[]
  addLoad: (load: Omit<Load, 'id' | 'createdAt'>) => void
  addResponsible: (name: string) => string // Returns ID
  getResponsibleName: (id: string) => string
}

export const useCargoStore = create<CargoState>()(
  persist(
    (set, get) => ({
      loads: [
        {
          id: '1',
          requestNumber: 'REQ-2024-001',
          cargoValue: 15000.5,
          associatedValue: 1200.0,
          responsibleId: 'r1',
          createdAt: new Date('2024-12-20T10:00:00').toISOString(),
        },
        {
          id: '2',
          requestNumber: 'REQ-2024-002',
          cargoValue: 45000.0,
          associatedValue: 3500.0,
          responsibleId: 'r2',
          createdAt: new Date('2024-12-21T14:30:00').toISOString(),
        },
        {
          id: '3',
          requestNumber: 'REQ-2024-003',
          cargoValue: 8000.0,
          associatedValue: 600.0,
          responsibleId: 'r1',
          createdAt: new Date('2024-12-22T09:15:00').toISOString(),
        },
        {
          id: '4',
          requestNumber: 'REQ-2024-004',
          cargoValue: 120000.0,
          associatedValue: 8000.0,
          responsibleId: 'r3',
          createdAt: new Date('2024-12-23T11:45:00').toISOString(),
        },
        {
          id: '5',
          requestNumber: 'REQ-2024-005',
          cargoValue: 25000.0,
          associatedValue: 1800.0,
          responsibleId: 'r2',
          createdAt: new Date('2024-12-24T16:20:00').toISOString(),
        },
      ],
      responsibles: [
        { id: 'r1', name: 'Carlos Silva' },
        { id: 'r2', name: 'Ana Oliveira' },
        { id: 'r3', name: 'Roberto Santos' },
        { id: 'r4', name: 'Fernanda Lima' },
      ],
      addLoad: (load) =>
        set((state) => ({
          loads: [
            {
              ...load,
              id: Math.random().toString(36).substring(2, 9),
              createdAt: new Date().toISOString(),
            },
            ...state.loads,
          ],
        })),
      addResponsible: (name) => {
        const id = Math.random().toString(36).substring(2, 9)
        set((state) => ({
          responsibles: [...state.responsibles, { id, name }],
        }))
        return id
      },
      getResponsibleName: (id) => {
        const responsible = get().responsibles.find((r) => r.id === id)
        return responsible ? responsible.name : 'Desconhecido'
      },
    }),
    {
      name: 'cargo-control-storage',
    },
  ),
)
