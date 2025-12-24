'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { statisticsApi, adminKycApi, paymentsApi, leadsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { PlatformStatistics, KYCSubmission, PaymentProof, Lead } from '@/types'
import {
  DollarSign,
  Users,
  Building2,
  Briefcase,
  FileCheck,
  CreditCard,
  UserPlus,
  TrendingUp,
  ArrowRight,
  Clock
} from 'lucide-react'

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['platform-statistics'],
    queryFn: () => statisticsApi.getPlatform(),
  })

  const { data: pendingKyc } = useQuery({
    queryKey: ['pending-kyc'],
    queryFn: () => adminKycApi.getPending(),
  })

  const { data: pendingPayments } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => paymentsApi.getPending(),
  })

  const { data: recentLeads } = useQuery({
    queryKey: ['leads', { status: 'new' }],
    queryFn: () => leadsApi.getAll({ status: 'new' }),
  })

  const statistics: PlatformStatistics = stats || {
    total_invested: 0,
    total_investors: 0,
    total_projects: 0,
    active_investments: 0,
    pending_kyc: 0,
    pending_payments: 0,
    total_leads: 0,
    leads_this_month: 0,
  }

  const kycList: KYCSubmission[] = pendingKyc?.results || []
  const paymentsList: PaymentProof[] = pendingPayments?.results || []
  const leadsList: Lead[] = recentLeads?.results || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">Panel de Administración</h1>
        <p className="text-gray-500">
          Vista general de la plataforma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-gray-500">Total Invertido</span>
          </div>
          <p className="text-2xl font-bold text-secondary">
            {formatCurrency(statistics.total_invested)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Inversionistas</span>
          </div>
          <p className="text-2xl font-bold text-secondary">
            {statistics.total_investors}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Proyectos</span>
          </div>
          <p className="text-2xl font-bold text-secondary">
            {statistics.total_projects}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Inversiones Activas</span>
          </div>
          <p className="text-2xl font-bold text-secondary">
            {statistics.active_investments}
          </p>
        </div>
      </div>

      {/* Pending Items */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/kyc" className="card hover:border-primary transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">KYC Pendientes</p>
                <p className="text-xl font-bold text-secondary">{statistics.pending_kyc}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/admin/pagos" className="card hover:border-primary transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagos Pendientes</p>
                <p className="text-xl font-bold text-secondary">{statistics.pending_payments}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/admin/leads" className="card hover:border-primary transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Leads Nuevos</p>
                <p className="text-xl font-bold text-secondary">{leadsList.length}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/admin/estadisticas" className="card hover:border-primary transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Leads Este Mes</p>
                <p className="text-xl font-bold text-secondary">{statistics.leads_this_month}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending KYC */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">KYC Pendientes</h2>
            <Link href="/admin/kyc" className="text-primary text-sm font-medium hover:underline">
              Ver todos
            </Link>
          </div>

          {kycList.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay KYC pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kycList.slice(0, 3).map((kyc) => (
                <div
                  key={kyc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-secondary">{kyc.full_name}</p>
                    <p className="text-sm text-gray-500">{kyc.user_email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {new Date(kyc.created_at).toLocaleDateString('es-CL')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">Pagos Pendientes</h2>
            <Link href="/admin/pagos" className="text-primary text-sm font-medium hover:underline">
              Ver todos
            </Link>
          </div>

          {paymentsList.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay pagos pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentsList.slice(0, 3).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-secondary">
                      {payment.project_title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.investor_email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary">
                      {formatCurrency(parseFloat(payment.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary">Leads Recientes</h2>
            <Link href="/admin/leads" className="text-primary text-sm font-medium hover:underline">
              Ver todos
            </Link>
          </div>

          {leadsList.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay leads nuevos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Fuente</th>
                    <th className="pb-3 font-medium">Asignado a</th>
                    <th className="pb-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsList.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-secondary">{lead.email}</td>
                      <td className="py-3 text-gray-600">{lead.name || '-'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lead.source === 'webhook' ? 'bg-purple-100 text-purple-700' :
                          lead.source === 'reservation' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {lead.source_display}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {lead.assigned_to_name || 'Sin asignar'}
                      </td>
                      <td className="py-3 text-gray-500 text-sm">
                        {new Date(lead.created_at).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
