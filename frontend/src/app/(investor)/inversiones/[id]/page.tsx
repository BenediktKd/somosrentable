'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { investmentsApi, paymentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Investment, ReturnProjection } from '@/types'
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Upload,
  AlertCircle,
  XCircle,
  DollarSign
} from 'lucide-react'

export default function InvestmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [uploadAmount, setUploadAmount] = useState('')
  const [error, setError] = useState('')

  const { data: investment, isLoading } = useQuery({
    queryKey: ['investment', id],
    queryFn: () => investmentsApi.getById(id),
  })

  const { data: projection } = useQuery({
    queryKey: ['investment-projection', id],
    queryFn: () => investmentsApi.getProjection(id),
    enabled: !!investment && investment.status === 'active',
  })

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => paymentsApi.uploadProof(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment', id] })
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      setShowUploadForm(false)
      setProofFile(null)
      setProofPreview(null)
      setUploadAmount('')
    },
    onError: (err: any) => {
      const errors = err.response?.data
      if (errors) {
        const firstError = Object.values(errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        setError('Error al subir el comprobante')
      }
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!proofFile) {
      setError('Por favor sube una imagen del comprobante')
      return
    }

    if (!uploadAmount || parseFloat(uploadAmount) <= 0) {
      setError('Por favor ingresa el monto transferido')
      return
    }

    const formData = new FormData()
    formData.append('investment_id', id)
    formData.append('proof_image', proofFile)
    formData.append('amount', uploadAmount)

    uploadMutation.mutate(formData)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'payment_review':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!investment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-secondary mb-2">
          Inversión no encontrada
        </h2>
        <Button onClick={() => router.push('/inversiones')}>
          Volver a Mis Inversiones
        </Button>
      </div>
    )
  }

  const inv: Investment = investment

  return (
    <div>
      {/* Back button */}
      <Link
        href="/inversiones"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Mis Inversiones
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary mb-2">
            {inv.project_title}
          </h1>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(inv.status)}`}>
            {inv.status === 'active' && <CheckCircle className="w-4 h-4" />}
            {inv.status === 'pending_payment' && <Clock className="w-4 h-4" />}
            {inv.status === 'payment_review' && <Clock className="w-4 h-4" />}
            {inv.status_display}
          </span>
        </div>

        {inv.status === 'pending_payment' && !showUploadForm && (
          <Button onClick={() => setShowUploadForm(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Subir Comprobante
          </Button>
        )}
      </div>

      {/* Payment Upload Form */}
      {showUploadForm && inv.status === 'pending_payment' && (
        <div className="card mb-8 border-2 border-primary">
          <h2 className="text-lg font-semibold text-secondary mb-4">
            Subir Comprobante de Pago
          </h2>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-700">
              <strong>Monto a transferir:</strong> {formatCurrency(parseFloat(inv.amount))}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Por favor realiza una transferencia por el monto indicado y sube el comprobante.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Transferido *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  required
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comprobante de Transferencia *
              </label>
              {proofPreview ? (
                <div className="relative">
                  <img
                    src={proofPreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProofFile(null)
                      setProofPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Haz clic para subir
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowUploadForm(false)
                  setProofFile(null)
                  setProofPreview(null)
                  setError('')
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Subiendo...' : 'Enviar Comprobante'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Review Notice */}
      {inv.status === 'payment_review' && (
        <div className="card mb-8 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800">Comprobante en Revisión</h3>
              <p className="text-sm text-orange-600">
                Hemos recibido tu comprobante y está siendo revisado. Te notificaremos cuando sea aprobado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Investment Details */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary mb-4">
            Detalles de la Inversión
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2 text-gray-500">
                <DollarSign className="w-4 h-4" />
                <span>Monto Invertido</span>
              </div>
              <span className="font-semibold text-secondary">
                {formatCurrency(parseFloat(inv.amount))}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2 text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Rentabilidad Anual</span>
              </div>
              <span className="font-semibold text-primary">
                {formatPercent(parseFloat(inv.annual_return_rate_snapshot))}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Duración</span>
              </div>
              <span className="font-semibold text-secondary">
                {inv.duration_months_snapshot} meses
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Fecha de Creación</span>
              </div>
              <span className="font-semibold text-secondary">
                {new Date(inv.created_at).toLocaleDateString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        {/* Return Projection */}
        {inv.status === 'active' && projection && (
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10">
            <h2 className="text-lg font-semibold text-secondary mb-4">
              Proyección de Retorno
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/20">
                <span className="text-gray-600">Retorno Mensual</span>
                <span className="font-semibold text-primary">
                  +{formatCurrency(parseFloat(projection.monthly_return))}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-primary/20">
                <span className="text-gray-600">Retorno Total ({projection.duration_months} meses)</span>
                <span className="font-semibold text-primary">
                  +{formatCurrency(parseFloat(projection.total_return))}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 bg-white/50 rounded-lg px-4 -mx-4">
                <span className="font-medium text-secondary">Monto Final Estimado</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(parseFloat(projection.final_amount))}
                </span>
              </div>

              {inv.expected_end_date && (
                <div className="text-center pt-4 border-t border-primary/20">
                  <p className="text-sm text-gray-500">Fecha estimada de retorno</p>
                  <p className="font-semibold text-secondary">
                    {new Date(inv.expected_end_date).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Payment Info */}
        {inv.status === 'pending_payment' && (
          <div className="card bg-yellow-50 border-yellow-200">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">
              Pendiente de Pago
            </h2>
            <p className="text-yellow-700 mb-4">
              Para activar tu inversión, realiza una transferencia por el monto indicado y sube el comprobante.
            </p>
            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500 mb-1">Monto a transferir</p>
              <p className="text-2xl font-bold text-secondary">
                {formatCurrency(parseFloat(inv.amount))}
              </p>
            </div>
            {!showUploadForm && (
              <Button onClick={() => setShowUploadForm(true)} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Subir Comprobante
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Timeline / Progress */}
      {inv.status === 'active' && inv.activated_at && inv.expected_end_date && (
        <div className="card">
          <h2 className="text-lg font-semibold text-secondary mb-4">
            Progreso de la Inversión
          </h2>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Inicio</span>
              <span className="text-sm text-gray-500">Fin estimado</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((Date.now() - new Date(inv.activated_at).getTime()) /
                      (new Date(inv.expected_end_date).getTime() - new Date(inv.activated_at).getTime())) * 100,
                    100
                  )}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-secondary">
                {new Date(inv.activated_at).toLocaleDateString('es-CL')}
              </span>
              <span className="font-medium text-secondary">
                {new Date(inv.expected_end_date).toLocaleDateString('es-CL')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
