'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { PaymentProof } from '@/types'
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  DollarSign
} from 'lucide-react'

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient()
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data: pendingPayments, isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => paymentsApi.getPending(),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, rejection_reason }: {
      id: string
      action: 'approve' | 'reject'
      rejection_reason?: string
    }) => paymentsApi.review(id, { action, rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] })
      queryClient.invalidateQueries({ queryKey: ['platform-statistics'] })
      setSelectedPayment(null)
      setShowRejectModal(false)
      setRejectionReason('')
    },
  })

  const paymentsList: PaymentProof[] = pendingPayments?.results || []

  const handleApprove = (payment: PaymentProof) => {
    reviewMutation.mutate({ id: payment.id, action: 'approve' })
  }

  const handleReject = () => {
    if (selectedPayment && rejectionReason.trim()) {
      reviewMutation.mutate({
        id: selectedPayment.id,
        action: 'reject',
        rejection_reason: rejectionReason,
      })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">Pagos Pendientes</h1>
        <p className="text-gray-500">
          Revisa y aprueba los comprobantes de pago
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paymentsList.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary mb-2">
            No hay pagos pendientes
          </h3>
          <p className="text-gray-500">
            Todos los comprobantes han sido procesados
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentsList.map((payment) => (
            <div key={payment.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary">
                        {payment.project_title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {payment.investor_email}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Monto Declarado</p>
                      <p className="font-semibold text-secondary">
                        {formatCurrency(parseFloat(payment.amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monto Inversión</p>
                      <p className="font-semibold text-secondary">
                        {formatCurrency(parseFloat(payment.investment_amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-semibold text-secondary flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(payment.created_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proof Image */}
                <div className="lg:w-48 flex-shrink-0">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={payment.proof_image}
                      alt="Comprobante"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group"
                    >
                      <div className="bg-white/90 px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Ver
                      </div>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2 lg:w-32">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(payment)}
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedPayment(payment)
                      setShowRejectModal(true)
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>

              {/* Amount mismatch warning */}
              {parseFloat(payment.amount) !== parseFloat(payment.investment_amount) && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-700">
                    <strong>Atención:</strong> El monto declarado ({formatCurrency(parseFloat(payment.amount))})
                    no coincide con el monto de la inversión ({formatCurrency(parseFloat(payment.investment_amount))}).
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedPayment && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedPayment(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedPayment.proof_image}
              alt="Comprobante"
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-4 bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold text-secondary">
                    {selectedPayment.project_title}
                  </p>
                  <p className="text-gray-500">{selectedPayment.investor_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(parseFloat(selectedPayment.amount))}
                  </p>
                  <p className="text-sm text-gray-500">Monto declarado</p>
                </div>
              </div>
              <div className="flex gap-3">
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
                  onClick={() => handleApprove(selectedPayment)}
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
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-secondary mb-4">
              Rechazar Comprobante
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Por qué rechazas el comprobante de <strong>{selectedPayment.investor_email}</strong>?
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
