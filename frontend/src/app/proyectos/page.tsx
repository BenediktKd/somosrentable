'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { projectsApi } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Project } from '@/types'
import { ArrowLeft } from 'lucide-react'

export default function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  })

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
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-500 hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-secondary">Proyectos de Inversión</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando proyectos...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects?.results?.map((project: Project) => (
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
