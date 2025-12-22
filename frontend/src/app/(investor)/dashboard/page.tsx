'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { investmentsApi, reservationsApi, kycApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { StatCardSkeleton, InvestmentRowSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Investment, Reservation, KYCStatus } from '@/types'
import {
  Briefcase,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileCheck
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: investments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: () => investmentsApi.getAll(),
  })

  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsApi.getMine(),
  })

  const { data: kycStatus } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus(),
  })

  const isLoading = investmentsLoading || reservationsLoading

  const investmentsList: Investment[] = investments?.results || []
  const reservationsList: Reservation[] = reservations?.results || []
  const kyc: KYCStatus = kycStatus || { has_submission: false, is_verified: false, can_submit: true }

  // Calculate stats
  const totalInvested = investmentsList
    .filter((i) => i.status === 'active' || i.status === 'completed')
    .reduce((sum, i) => sum + parseFloat(i.amount), 0)

  const expectedReturns = investmentsList
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + parseFloat(i.expected_return), 0)

  const activeInvestments = investmentsList.filter((i) => i.status === 'active').length
  const pendingPayments = investmentsList.filter((i) => i.status === 'pending_payment').length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">
          Hola, {user?.first_name || 'Inversionista'}
        </h1>
        <p className="text-gray-500">
          Bienvenido a tu panel de inversiones
        </p>
      </div>

      {/* KYC Alert */}
      {!kyc.is_verified && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          kyc.submission?.status === 'rejected'
            ? 'bg-red-50 border border-red-200'
            : kyc.submission?.status === 'pending'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          {kyc.submission?.status === 'rejected' ? (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          ) : kyc.submission?.status === 'pending' ? (
            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          ) : (
            <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`font-medium ${
              kyc.submission?.status === 'rejected'
                ? 'text-red-800'
                : kyc.submission?.status === 'pending'
                ? 'text-yellow-800'
                : 'text-blue-800'
            }`}>
              {kyc.submission?.status === 'rejected'
                ? 'Verificación rechazada'
                : kyc.submission?.status === 'pending'
                ? 'Verificación en proceso'
                : 'Completa tu verificación KYC'}
            </h3>
            <p className={`text-sm ${
              kyc.submission?.status === 'rejected'
                ? 'text-red-600'
                : kyc.submission?.status === 'pending'
                ? 'text-yellow-600'
                : 'text-blue-600'
            }`}>
              {kyc.submission?.status === 'rejected'
                ? kyc.submission.rejection_reason || 'Tu verificación fue rechazada. Por favor, intenta nuevamente.'
                : kyc.submission?.status === 'pending'
                ? 'Estamos revisando tus documentos. Te notificaremos pronto.'
                : 'Para poder invertir, necesitas verificar tu identidad.'}
            </p>
            {(kyc.can_submit || kyc.submission?.status === 'rejected') && (
              <Link href="/kyc">
                <Button size="sm" className="mt-3">
                  {kyc.submission?.status === 'rejected' ? 'Reintentar' : 'Verificar ahora'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {kyc.is_verified && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-800 font-medium">
            Tu identidad está verificada. Puedes invertir en proyectos.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-gray-500">Total Invertido</span>
              </div>
              <p className="text-2xl font-bold text-secondary">
                {formatCurrency(totalInvested)}
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Rentabilidad Esperada</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                +{formatCurrency(expectedReturns)}
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Inversiones Activas</span>
              </div>
              <p className="text-2xl font-bold text-secondary">
                {activeInvestments}
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-500">Pendientes de Pago</span>
              </div>
              <p className="text-2xl font-bold text-secondary">
                {pendingPayments}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Investments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">Mis Inversiones</h2>
            <Link href="/inversiones" className="text-primary text-sm font-medium hover:underline">
              Ver todas
            </Link>
          </div>

          {investmentsList.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aún no tienes inversiones</p>
              <Link href="/proyectos">
                <Button>
                  Explorar Proyectos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {investmentsList.slice(0, 3).map((investment) => (
                <Link
                  key={investment.id}
                  href={`/inversiones/${investment.id}`}
                  className="block p-3 rounded-lg border hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-secondary">
                      {investment.project_title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      investment.status === 'active' ? 'bg-green-100 text-green-700' :
                      investment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      investment.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                      investment.status === 'payment_review' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {investment.status_display}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {formatCurrency(parseFloat(investment.amount))}
                    </span>
                    <span className="text-primary font-medium">
                      {formatPercent(parseFloat(investment.annual_return_rate_snapshot))} anual
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Reservations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">Mis Reservas</h2>
            <Link href="/reservas" className="text-primary text-sm font-medium hover:underline">
              Ver todas
            </Link>
          </div>

          {reservationsList.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No tienes reservas pendientes</p>
              <Link href="/proyectos">
                <Button variant="secondary">
                  Ver Proyectos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservationsList.slice(0, 3).map((reservation) => (
                <div
                  key={reservation.id}
                  className="p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-secondary">
                      {reservation.project_title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      reservation.status === 'converted' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {reservation.status_display}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {formatCurrency(parseFloat(reservation.amount))}
                    </span>
                    {reservation.can_convert && kyc.is_verified && (
                      <Link href={`/reservas?convert=${reservation.access_token}`}>
                        <Button size="sm" variant="ghost" className="text-primary">
                          Convertir a inversión
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-secondary mb-4">Acciones Rápidas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/proyectos" className="card hover:border-primary transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-secondary">Explorar Proyectos</h3>
                <p className="text-sm text-gray-500">Ver oportunidades de inversión</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </Link>

          {!kyc.is_verified && (
            <Link href="/kyc" className="card hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-secondary">Verificar Identidad</h3>
                  <p className="text-sm text-gray-500">Completa tu KYC</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
              </div>
            </Link>
          )}

          {pendingPayments > 0 && (
            <Link href="/inversiones" className="card hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-secondary">Subir Comprobante</h3>
                  <p className="text-sm text-gray-500">{pendingPayments} inversión(es) pendiente(s)</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
