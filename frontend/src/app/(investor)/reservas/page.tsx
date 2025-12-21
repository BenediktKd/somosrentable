'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reservationsApi, kycApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Reservation, KYCStatus } from '@/types'
import {
  BookMarked,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react'

export default function ReservationsPage() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const convertToken = searchParams.get('convert')

  const [convertingToken, setConvertingToken] = useState<string | null>(convertToken)
  const [error, setError] = useState('')

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsApi.getMine(),
  })

  const { data: kycStatus } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus(),
  })

  const convertMutation = useMutation({
    mutationFn: (token: string) => reservationsApi.convert(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      setConvertingToken(null)
    },
    onError: (err: any) => {
      const errors = err.response?.data
      if (errors?.detail) {
        setError(errors.detail)
      } else if (errors) {
        const firstError = Object.values(errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        setError('Error al convertir la reserva')
      }
    },
  })

  const reservationsList: Reservation[] = reservations?.results || []
  const kyc: KYCStatus = kycStatus || { has_submission: false, is_verified: false, can_submit: true }

  const pendingReservations = reservationsList.filter(r => r.status === 'pending')
  const otherReservations = reservationsList.filter(r => r.status !== 'pending')

  const handleConvert = (token: string) => {
    setError('')
    convertMutation.mutate(token)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'converted':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'converted':
        return 'bg-green-100 text-green-700'
      case 'expired':
        return 'bg-gray-100 text-gray-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">Mis Reservas</h1>
        <p className="text-gray-500">
          Gestiona tus reservas de inversión
        </p>
      </div>

      {/* KYC Warning */}
      {!kyc.is_verified && pendingReservations.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">
                Verificación requerida
              </h3>
              <p className="text-sm text-blue-600">
                Para convertir tus reservas en inversiones, necesitas completar la verificación KYC.
              </p>
              <Link href="/kyc">
                <Button size="sm" className="mt-3">
                  Verificar Identidad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reservationsList.length === 0 ? (
        <div className="card text-center py-12">
          <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary mb-2">
            No tienes reservas
          </h3>
          <p className="text-gray-500 mb-6">
            Explora nuestros proyectos y reserva tu inversión
          </p>
          <Link href="/proyectos">
            <Button>
              Ver Proyectos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Reservations */}
          {pendingReservations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-secondary mb-4">
                Reservas Pendientes
              </h2>
              <div className="space-y-4">
                {pendingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className={`card ${
                      convertingToken === reservation.access_token
                        ? 'border-2 border-primary'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(reservation.status)}
                          <h3 className="font-semibold text-secondary">
                            {reservation.project_title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                            {reservation.status_display}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>
                            Monto: <span className="font-medium text-secondary">
                              {formatCurrency(parseFloat(reservation.amount))}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Expira: {new Date(reservation.expires_at).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {reservation.can_convert && kyc.is_verified ? (
                          <Button
                            onClick={() => handleConvert(reservation.access_token)}
                            disabled={convertMutation.isPending}
                          >
                            {convertMutation.isPending && convertingToken === reservation.access_token
                              ? 'Convirtiendo...'
                              : 'Convertir a Inversión'}
                          </Button>
                        ) : reservation.can_convert && !kyc.is_verified ? (
                          <Link href="/kyc">
                            <Button variant="secondary">
                              Verificar para Invertir
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    {reservation.is_expired && (
                      <div className="mt-4 p-3 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">
                          Esta reserva ha expirado. Puedes crear una nueva reserva en el proyecto.
                        </p>
                      </div>
                    )}

                    {convertingToken === reservation.access_token && kyc.is_verified && (
                      <div className="mt-4 p-4 rounded-lg bg-primary-50 border border-primary-200">
                        <h4 className="font-medium text-primary-800 mb-2">
                          ¿Confirmar conversión?
                        </h4>
                        <p className="text-sm text-primary-600 mb-4">
                          Al convertir esta reserva, se creará una inversión por{' '}
                          <strong>{formatCurrency(parseFloat(reservation.amount))}</strong>.
                          Luego deberás subir el comprobante de pago.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConvertingToken(null)}
                            disabled={convertMutation.isPending}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConvert(reservation.access_token)}
                            disabled={convertMutation.isPending}
                          >
                            {convertMutation.isPending ? 'Procesando...' : 'Confirmar'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Reservations */}
          {otherReservations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-secondary mb-4">
                Historial de Reservas
              </h2>
              <div className="space-y-4">
                {otherReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="card bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(reservation.status)}
                          <h3 className="font-semibold text-secondary">
                            {reservation.project_title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                            {reservation.status_display}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>
                            Monto: <span className="font-medium text-secondary">
                              {formatCurrency(parseFloat(reservation.amount))}
                            </span>
                          </span>
                          <span>
                            Creada: {new Date(reservation.created_at).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                      </div>

                      {reservation.status === 'converted' && (
                        <Link href="/inversiones">
                          <Button variant="ghost" size="sm">
                            Ver Inversión
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
