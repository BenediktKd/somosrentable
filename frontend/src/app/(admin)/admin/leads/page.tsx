'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Lead } from '@/types'
import {
  Users,
  Filter,
  Phone,
  Mail,
  Calendar,
  Building2,
  User,
  MessageSquare
} from 'lucide-react'

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'contacted', label: 'Contactados' },
  { value: 'qualified', label: 'Calificados' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'lost', label: 'Perdidos' },
]

const statusOptions = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'converted', label: 'Convertido' },
  { value: 'lost', label: 'Perdido' },
]

export default function AdminLeadsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', { status: statusFilter }],
    queryFn: () => leadsApi.getAll(statusFilter ? { status: statusFilter } : undefined),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; notes?: string } }) =>
      leadsApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setSelectedLead(null)
      setNewStatus('')
      setNotes('')
    },
  })

  const leadsList: Lead[] = leads?.results || []

  const handleUpdateStatus = () => {
    if (selectedLead && newStatus) {
      updateMutation.mutate({
        id: selectedLead.id,
        data: {
          status: newStatus,
          notes: notes.trim() || undefined,
        },
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-700'
      case 'qualified':
        return 'bg-purple-100 text-purple-700'
      case 'converted':
        return 'bg-green-100 text-green-700'
      case 'lost':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'webhook':
        return 'bg-purple-100 text-purple-700'
      case 'reservation':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">Gestión de Leads</h1>
        <p className="text-gray-500">
          Administra y da seguimiento a los leads
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === filter.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leadsList.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary mb-2">
            No hay leads
          </h3>
          <p className="text-gray-500">
            {statusFilter ? 'No hay leads con este estado' : 'Aún no se han registrado leads'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 bg-gray-50">
                  <th className="px-6 py-4 font-medium">Contacto</th>
                  <th className="px-6 py-4 font-medium">Fuente</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Asignado a</th>
                  <th className="px-6 py-4 font-medium">Proyecto</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {leadsList.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-secondary">
                          {lead.name || 'Sin nombre'}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(lead.source)}`}>
                        {lead.source_display}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {lead.assigned_to_name || 'Sin asignar'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.project_title ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{lead.project_title}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(lead.created_at).toLocaleDateString('es-CL')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedLead(lead)
                          setNewStatus(lead.status)
                          setNotes(lead.notes || '')
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Gestionar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-secondary mb-4">
              Gestionar Lead
            </h3>

            {/* Lead Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-secondary">
                    {selectedLead.name || 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-500">{selectedLead.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="ml-2 text-secondary">{selectedLead.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fuente:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getSourceColor(selectedLead.source)}`}>
                    {selectedLead.source_display}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Proyecto:</span>
                  <span className="ml-2 text-secondary">{selectedLead.project_title || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Asignado:</span>
                  <span className="ml-2 text-secondary">{selectedLead.assigned_to_name || 'Sin asignar'}</span>
                </div>
              </div>
            </div>

            {/* Update Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Agrega notas sobre el seguimiento..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setSelectedLead(null)
                  setNewStatus('')
                  setNotes('')
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateStatus}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
