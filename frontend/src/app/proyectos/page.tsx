'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ProjectCardSkeleton } from '@/components/ui/skeleton'
import { projectsApi } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Project } from '@/types'
import { ArrowLeft, Filter, ArrowUpDown } from 'lucide-react'

type SortOption = 'recent' | 'return_high' | 'return_low' | 'investment_low'
type FilterStatus = 'all' | 'funding' | 'funded'

export default function ProjectsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  })

  const filteredAndSortedProjects = useMemo(() => {
    if (!projects?.results) return []

    let filtered = [...projects.results]

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p: Project) => p.status === filterStatus)
    }

    // Sort
    filtered.sort((a: Project, b: Project) => {
      switch (sortBy) {
        case 'return_high':
          return parseFloat(b.annual_return_rate) - parseFloat(a.annual_return_rate)
        case 'return_low':
          return parseFloat(a.annual_return_rate) - parseFloat(b.annual_return_rate)
        case 'investment_low':
          return parseFloat(a.minimum_investment) - parseFloat(b.minimum_investment)
        default:
          return 0 // Keep original order (most recent)
      }
    })

    return filtered
  }, [projects, sortBy, filterStatus])

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container-custom flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            SomosRentable
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/registro">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-12">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-gray-500 hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-secondary">Proyectos de Inversión</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Estado:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'funding', label: 'En Financiación' },
                  { value: 'funded', label: 'Financiados' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterStatus(option.value as FilterStatus)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filterStatus === option.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="recent">Más recientes</option>
                <option value="return_high">Mayor rentabilidad</option>
                <option value="return_low">Menor rentabilidad</option>
                <option value="investment_low">Menor inversión</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500">No hay proyectos con los filtros seleccionados</p>
            <button
              onClick={() => { setFilterStatus('all'); setSortBy('recent'); }}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedProjects.map((project: Project) => (
              <div key={project.id} className="card hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  {project.main_image && (
                    <img
                      src={project.main_image}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'funding' ? 'bg-green-100 text-green-700' :
                    project.status === 'funded' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status_display}
                  </span>
                  {project.is_featured && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary">
                      Destacado
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-500 text-sm mb-2">{project.location}</p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.short_description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rentabilidad anual</span>
                    <span className="font-semibold text-primary">
                      {formatPercent(parseFloat(project.annual_return_rate))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Inversión mínima</span>
                    <span className="font-semibold">
                      {formatCurrency(project.minimum_investment)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duración</span>
                    <span className="font-semibold">{project.duration_months} meses</span>
                  </div>

                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min(parseFloat(project.funding_progress), 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatPercent(parseFloat(project.funding_progress))} financiado</span>
                      <span>{formatCurrency(project.current_amount)} / {formatCurrency(project.target_amount)}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/proyectos/${project.slug}`}>
                  <Button className="w-full mt-4">Ver Detalles</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
