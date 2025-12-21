'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { projectsApi, reservationsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Project } from '@/types'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Calculator,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const { isAuthenticated } = useAuth()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [calculatorAmount, setCalculatorAmount] = useState('')
  const [calculatedReturn, setCalculatedReturn] = useState<{
    monthly_return: string
    total_return: string
    final_amount: string
  } | null>(null)

  // Reservation form state
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [reservationData, setReservationData] = useState({
    email: '',
    name: '',
    phone: '',
    amount: '',
  })
  const [reservationError, setReservationError] = useState('')
  const [reservationSuccess, setReservationSuccess] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => projectsApi.getBySlug(slug),
  })

  const calculateMutation = useMutation({
    mutationFn: (amount: number) => projectsApi.calculateReturn(slug, amount),
    onSuccess: (data) => {
      setCalculatedReturn(data)
    },
  })

  const reservationMutation = useMutation({
    mutationFn: (data: {
      email: string
      name?: string
      phone?: string
      project_id: string
      amount: number
    }) => reservationsApi.create(data),
    onSuccess: () => {
      setReservationSuccess(true)
      setShowReservationForm(false)
    },
    onError: (err: any) => {
      const errors = err.response?.data
      if (errors) {
        const firstError = Object.values(errors)[0]
        setReservationError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        setReservationError('Error al crear la reserva')
      }
    },
  })

  const handleCalculate = () => {
    const amount = parseFloat(calculatorAmount)
    if (amount > 0) {
      calculateMutation.mutate(amount)
    }
  }

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault()
    setReservationError('')

    if (!project) return

    const amount = parseFloat(reservationData.amount)
    if (!amount || amount < parseFloat(project.minimum_investment)) {
      setReservationError(`El monto mínimo es ${formatCurrency(parseFloat(project.minimum_investment))}`)
      return
    }

    reservationMutation.mutate({
      email: reservationData.email,
      name: reservationData.name || undefined,
      phone: reservationData.phone || undefined,
      project_id: project.id,
      amount,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary mb-4">Proyecto no encontrado</h2>
          <Link href="/proyectos">
            <Button>Ver todos los proyectos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const proj: Project = project
  const images: { image: string; caption: string }[] = proj.images?.length > 0
    ? proj.images.map(img => ({ image: img.image, caption: img.caption }))
    : proj.main_image
      ? [{ image: proj.main_image, caption: '' }]
      : []

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            SomosRentable
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Mi Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
                <Link href="/registro">
                  <Button>Registrarse</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Back link */}
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Proyectos
        </Link>

        {reservationSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">¡Reserva creada exitosamente!</h3>
                <p className="text-sm text-green-600">
                  Hemos enviado los detalles a tu correo. Tienes 7 días para completar tu inversión.
                </p>
                {!isAuthenticated && (
                  <Link href="/registro">
                    <Button size="sm" className="mt-3">
                      Registrarme para invertir
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={images[currentImageIndex]?.image}
                    alt={proj.title}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Project Info */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  proj.status === 'funding' ? 'bg-green-100 text-green-700' :
                  proj.status === 'funded' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {proj.status_display}
                </span>
                {proj.is_featured && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary">
                    Destacado
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-secondary mb-2">{proj.title}</h1>

              <div className="flex items-center gap-2 text-gray-500 mb-6">
                <MapPin className="w-4 h-4" />
                <span>{proj.location}</span>
                {proj.address && <span>• {proj.address}</span>}
              </div>

              <p className="text-gray-600 whitespace-pre-line">{proj.description}</p>
            </div>

            {/* Return Calculator */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Calculadora de Rentabilidad
              </h2>

              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto a invertir
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={calculatorAmount}
                      onChange={(e) => setCalculatorAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={`Mín. ${formatCurrency(parseFloat(proj.minimum_investment))}`}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCalculate}
                  className="self-end"
                  disabled={calculateMutation.isPending}
                >
                  Calcular
                </Button>
              </div>

              {calculatedReturn && (
                <div className="grid sm:grid-cols-3 gap-4 p-4 bg-primary-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Retorno Mensual</p>
                    <p className="text-lg font-bold text-primary">
                      +{formatCurrency(parseFloat(calculatedReturn.monthly_return))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Retorno Total</p>
                    <p className="text-lg font-bold text-primary">
                      +{formatCurrency(parseFloat(calculatedReturn.total_return))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto Final</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(parseFloat(calculatedReturn.final_amount))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Card */}
            <div className="card sticky top-24">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Rentabilidad anual</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPercent(parseFloat(proj.annual_return_rate))}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Inversión mínima</span>
                  <span className="font-semibold text-secondary">
                    {formatCurrency(parseFloat(proj.minimum_investment))}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Duración</span>
                  <span className="font-semibold text-secondary flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {proj.duration_months} meses
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Inversionistas</span>
                  <span className="font-semibold text-secondary flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {proj.investor_count}
                  </span>
                </div>
              </div>

              {/* Funding Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Financiamiento</span>
                  <span className="font-semibold text-primary">
                    {formatPercent(parseFloat(proj.funding_progress))}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(parseFloat(proj.funding_progress), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatCurrency(parseFloat(proj.current_amount))}</span>
                  <span>{formatCurrency(parseFloat(proj.target_amount))}</span>
                </div>
              </div>

              {proj.status === 'funding' && (
                <>
                  {!showReservationForm ? (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setShowReservationForm(true)}
                    >
                      Reservar Inversión
                    </Button>
                  ) : (
                    <form onSubmit={handleReservation} className="space-y-4">
                      <h3 className="font-semibold text-secondary">Crear Reserva</h3>

                      {reservationError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                          {reservationError}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={reservationData.email}
                          onChange={(e) => setReservationData({ ...reservationData, email: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="tu@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre (opcional)
                        </label>
                        <input
                          type="text"
                          value={reservationData.name}
                          onChange={(e) => setReservationData({ ...reservationData, name: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto a Invertir *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            required
                            value={reservationData.amount}
                            onChange={(e) => setReservationData({ ...reservationData, amount: e.target.value })}
                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder={`Mín. ${formatCurrency(parseFloat(proj.minimum_investment))}`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setShowReservationForm(false)
                            setReservationError('')
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={reservationMutation.isPending}
                        >
                          {reservationMutation.isPending ? 'Enviando...' : 'Reservar'}
                        </Button>
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        La reserva expira en 7 días. Solo necesitas email para reservar.
                      </p>
                    </form>
                  )}
                </>
              )}

              {proj.status !== 'funding' && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    Este proyecto no está aceptando inversiones actualmente.
                  </p>
                </div>
              )}
            </div>

            {/* Key Dates */}
            {(proj.funding_end_date || proj.project_start_date) && (
              <div className="card">
                <h3 className="font-semibold text-secondary mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Fechas Clave
                </h3>
                <div className="space-y-3">
                  {proj.funding_end_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cierre de financiamiento</span>
                      <span className="font-medium text-secondary">
                        {new Date(proj.funding_end_date).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  )}
                  {proj.project_start_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Inicio del proyecto</span>
                      <span className="font-medium text-secondary">
                        {new Date(proj.project_start_date).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary text-white py-8 mt-12">
        <div className="container-custom text-center">
          <p className="text-gray-300">
            &copy; {new Date().getFullYear()} SomosRentable. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
