'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { investmentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Investment } from '@/types'
import {
  Briefcase,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react'
import { useState } from 'react'

const statusFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'pending_payment', label: 'Pendientes de Pago' },
  { value: 'payment_review', label: 'En Revisión' },
  { value: 'completed', label: 'Completadas' },
]

export default function InvestmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: () => investmentsApi.getAll(),
  })

  const investmentsList: Investment[] = investments?.results || []

  const filteredInvestments = statusFilter === 'all'
    ? investmentsList
    : investmentsList.filter((i) => i.status === statusFilter)

  // Stats
  const totalInvested = investmentsList
    .filter((i) => ['active', 'completed'].includes(i.status))
    .reduce((sum, i) => sum + parseFloat(i.amount), 0)

  const totalReturns = investmentsList
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + parseFloat(i.expected_return), 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'pending_payment':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'payment_review':
        return <Clock className="w-4 h-4 text-orange-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-700'
      case 'payment_review':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">Mis Inversiones</h1>
        <p className="text-gray-500">
          Gestiona y monitorea todas tus inversiones
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invertido</p>
              <p className="text-xl font-bold text-secondary">
                {formatCurrency(totalInvested)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rentabilidad Esperada</p>
              <p className="text-xl font-bold text-green-600">
                +{formatCurrency(totalReturns)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Inversiones</p>
              <p className="text-xl font-bold text-secondary">
                {investmentsList.length}
              </p>
            </div>
          </div>
        </div>
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

      {/* Investments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredInvestments.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary mb-2">
            {statusFilter === 'all'
              ? 'Aún no tienes inversiones'
              : 'No hay inversiones con este estado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {statusFilter === 'all'
              ? 'Explora nuestros proyectos y comienza a invertir'
              : 'Cambia el filtro para ver otras inversiones'}
          </p>
          {statusFilter === 'all' && (
            <Link href="/proyectos">
              <Button>
                Explorar Proyectos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvestments.map((investment) => (
            <Link
              key={investment.id}
              href={`/inversiones/${investment.id}`}
              className="card block hover:border-primary transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(investment.status)}
                    <h3 className="font-semibold text-secondary">
                      {investment.project_title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(investment.status)}`}>
                      {investment.status_display}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>
                      Invertido: <span className="font-medium text-secondary">
                        {formatCurrency(parseFloat(investment.amount))}
                      </span>
                    </span>
                    <span>
                      Rentabilidad: <span className="font-medium text-primary">
                        {formatPercent(parseFloat(investment.annual_return_rate_snapshot))} anual
                      </span>
                    </span>
                    <span>
                      Duración: <span className="font-medium text-secondary">
                        {investment.duration_months_snapshot} meses
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {investment.status === 'active' && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Retorno Esperado</p>
                      <p className="text-lg font-bold text-green-600">
                        +{formatCurrency(parseFloat(investment.expected_return))}
                      </p>
                    </div>
                  )}
                  {investment.status === 'pending_payment' && (
                    <Button size="sm" className="whitespace-nowrap">
                      Subir Comprobante
                    </Button>
                  )}
                  <ArrowRight className="w-5 h-5 text-gray-400 hidden sm:block" />
                </div>
              </div>

              {investment.expected_end_date && investment.status === 'active' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Fecha estimada de retorno</span>
                    <span className="font-medium text-secondary">
                      {new Date(investment.expected_end_date).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
