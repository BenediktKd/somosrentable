'use client'

import { useQuery } from '@tanstack/react-query'
import { statisticsApi } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { PlatformStatistics, ExecutiveStatistics } from '@/types'
import {
  BarChart3,
  DollarSign,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  UserCheck,
  Target
} from 'lucide-react'

export default function AdminStatisticsPage() {
  const { data: platformStats, isLoading: loadingPlatform } = useQuery({
    queryKey: ['platform-statistics'],
    queryFn: () => statisticsApi.getPlatform(),
  })

  const { data: executiveStats, isLoading: loadingExecutives } = useQuery({
    queryKey: ['executive-statistics'],
    queryFn: () => statisticsApi.getExecutives(),
  })

  // Map nested API response to flat structure
  const stats: PlatformStatistics = platformStats ? {
    total_invested: platformStats.investments?.total_amount || 0,
    total_investors: platformStats.users?.total_investors || 0,
    total_projects: platformStats.projects?.total || 0,
    active_investments: platformStats.investments?.total_count || 0,
    pending_kyc: platformStats.users?.pending_kyc || 0,
    pending_payments: platformStats.payments?.pending || 0,
    total_leads: platformStats.leads?.total || 0,
    leads_this_month: platformStats.leads?.new_30d || 0,
  } : {
    total_invested: 0,
    total_investors: 0,
    total_projects: 0,
    active_investments: 0,
    pending_kyc: 0,
    pending_payments: 0,
    total_leads: 0,
    leads_this_month: 0,
  }

  // Map executives from array (API returns array directly, not { results: [] })
  const rawExecutives = Array.isArray(executiveStats) ? executiveStats : (executiveStats?.results || [])
  const executives: ExecutiveStatistics[] = rawExecutives.map((exec: Record<string, unknown>) => ({
    id: exec.executive_id as string,
    name: exec.executive_name as string,
    email: exec.executive_email as string,
    total_leads: (exec.leads as Record<string, number>)?.total || 0,
    new_leads: (exec.leads as Record<string, number>)?.new || 0,
    converted_leads: (exec.leads as Record<string, number>)?.converted || 0,
    conversion_rate: (exec.leads as Record<string, number>)?.conversion_rate || 0,
  }))

  const isLoading = loadingPlatform || loadingExecutives

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">Estadísticas</h1>
        <p className="text-gray-500">
          Métricas y rendimiento de la plataforma
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Platform Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-secondary mb-4">
              Estadísticas de la Plataforma
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Invertido</p>
                    <p className="text-2xl font-bold text-secondary">
                      {formatCurrency(stats.total_invested)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inversionistas</p>
                    <p className="text-2xl font-bold text-secondary">
                      {stats.total_investors}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Proyectos</p>
                    <p className="text-2xl font-bold text-secondary">
                      {stats.total_projects}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inversiones Activas</p>
                    <p className="text-2xl font-bold text-secondary">
                      {stats.active_investments}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leads Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-secondary mb-4">
              Leads
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Target className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Leads</p>
                      <p className="text-2xl font-bold text-secondary">
                        {stats.total_leads}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Leads Este Mes</p>
                      <p className="text-2xl font-bold text-secondary">
                        {stats.leads_this_month}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Performance */}
          <div>
            <h2 className="text-lg font-semibold text-secondary mb-4">
              Rendimiento por Ejecutivo
            </h2>

            {executives.length === 0 ? (
              <div className="card text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay datos de ejecutivos</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-4">
                {executives.map((exec) => (
                  <div key={exec.id} className="card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary">
                          {exec.name || exec.email}
                        </p>
                        <p className="text-sm text-gray-500">{exec.email}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total Leads</span>
                        <span className="font-semibold text-secondary">{exec.total_leads}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Leads Nuevos</span>
                        <span className="font-semibold text-blue-600">{exec.new_leads}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Convertidos</span>
                        <span className="font-semibold text-green-600">{exec.converted_leads}</span>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Tasa de Conversión</span>
                          <span className="text-lg font-bold text-primary">
                            {formatPercent(exec.conversion_rate)}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min(exec.conversion_rate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
