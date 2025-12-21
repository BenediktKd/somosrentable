'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Project } from '@/types'
import {
  Building2,
  Plus,
  Edit,
  Eye,
  TrendingUp,
  Users
} from 'lucide-react'

export default function AdminProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  })

  const projectsList: Project[] = projects?.results || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'funding':
        return 'bg-green-100 text-green-700'
      case 'funded':
        return 'bg-blue-100 text-blue-700'
      case 'in_progress':
        return 'bg-purple-100 text-purple-700'
      case 'completed':
        return 'bg-teal-100 text-teal-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Proyectos</h1>
          <p className="text-gray-500">
            Gestiona los proyectos de inversión
          </p>
        </div>
        <Button disabled>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projectsList.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary mb-2">
            No hay proyectos
          </h3>
          <p className="text-gray-500 mb-4">
            Crea tu primer proyecto de inversión
          </p>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Crear Proyecto
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {projectsList.map((project) => (
            <div key={project.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Image */}
                <div className="lg:w-48 flex-shrink-0">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {project.main_image ? (
                      <img
                        src={project.main_image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-secondary">
                      {project.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status_display}
                    </span>
                    {project.is_featured && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary">
                        Destacado
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-sm mb-3">{project.location}</p>

                  <div className="grid sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Objetivo</p>
                      <p className="font-semibold text-secondary">
                        {formatCurrency(parseFloat(project.target_amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Recaudado</p>
                      <p className="font-semibold text-primary">
                        {formatCurrency(parseFloat(project.current_amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Rentabilidad
                      </p>
                      <p className="font-semibold text-green-600">
                        {formatPercent(parseFloat(project.annual_return_rate))}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Inversionistas
                      </p>
                      <p className="font-semibold text-secondary">
                        {project.investor_count}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progreso de financiamiento</span>
                      <span>{formatPercent(parseFloat(project.funding_progress))}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min(parseFloat(project.funding_progress), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2 lg:w-28">
                  <Link href={`/proyectos/${project.slug}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                  <Button variant="ghost" className="flex-1" disabled>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-500 text-center">
          La creación y edición de proyectos está disponible a través del panel de administración de Django en{' '}
          <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            localhost:8000/admin/
          </a>
        </p>
      </div>
    </div>
  )
}
