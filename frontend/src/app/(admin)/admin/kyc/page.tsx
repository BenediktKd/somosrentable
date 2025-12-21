'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminKycApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { KYCSubmission } from '@/types'
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Eye,
  X
} from 'lucide-react'

export default function AdminKYCPage() {
  const queryClient = useQueryClient()
  const [selectedKyc, setSelectedKyc] = useState<KYCSubmission | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data: pendingKyc, isLoading } = useQuery({
    queryKey: ['pending-kyc'],
    queryFn: () => adminKycApi.getPending(),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, rejection_reason }: {
      id: string
      action: 'approve' | 'reject'
      rejection_reason?: string
    }) => adminKycApi.review(id, { action, rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-kyc'] })
      queryClient.invalidateQueries({ queryKey: ['platform-statistics'] })
      setSelectedKyc(null)
      setShowRejectModal(false)
      setRejectionReason('')
    },
  })

  const kycList: KYCSubmission[] = pendingKyc?.results || []

  const handleApprove = (kyc: KYCSubmission) => {
    reviewMutation.mutate({ id: kyc.id, action: 'approve' })
  }

  const handleReject = () => {
    if (selectedKyc && rejectionReason.trim()) {
      reviewMutation.mutate({
        id: selectedKyc.id,
        action: 'reject',
        rejection_reason: rejectionReason,
      })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">KYC Pendientes</h1>
        <p className="text-gray-500">
          Revisa y aprueba las verificaciones de identidad
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : kycList.length === 0 ? (
        <div className="card text-center py-12">
          <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary mb-2">
            No hay KYC pendientes
          </h3>
          <p className="text-gray-500">
            Todas las solicitudes han sido procesadas
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {kycList.map((kyc) => (
            <div key={kyc.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">{kyc.full_name}</h3>
                    <p className="text-sm text-gray-500">{kyc.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {new Date(kyc.created_at).toLocaleDateString('es-CL')}
                </div>
              </div>

              {/* Document Preview */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Documento de Identidad</p>
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={kyc.document_photo}
                    alt="Documento"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setSelectedKyc(kyc)}
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group"
                  >
                    <div className="bg-white/90 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Ver más grande
                    </div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedKyc(kyc)
                    setShowRejectModal(true)
                  }}
                  disabled={reviewMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(kyc)}
                  disabled={reviewMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedKyc && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedKyc(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedKyc.document_photo}
              alt="Documento"
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-4 bg-white rounded-lg p-4">
              <p className="text-lg font-semibold text-secondary">{selectedKyc.full_name}</p>
              <p className="text-gray-500">{selectedKyc.user_email}</p>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectModal(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedKyc)}
                  disabled={reviewMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-secondary mb-4">
              Rechazar Verificación
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Por qué rechazas la verificación de <strong>{selectedKyc.full_name}</strong>?
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              rows={3}
              placeholder="Ingresa el motivo del rechazo..."
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || reviewMutation.isPending}
              >
                {reviewMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
