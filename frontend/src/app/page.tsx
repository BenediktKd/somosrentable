'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Project } from '@/types'
import {
  Building2,
  TrendingUp,
  Users,
  Shield,
  ChevronDown,
  ArrowRight
} from 'lucide-react'

export default function HomePage() {
  const { data: projects } = useQuery({
    queryKey: ['projects', 'featured'],
    queryFn: () => projectsApi.getAll({ featured: true }),
  })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="container-custom flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            SomosRentable
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/proyectos" className="text-gray-600 hover:text-primary">
              Proyectos
            </Link>
            <Link href="#como-funciona" className="text-gray-600 hover:text-primary">
              ¿Cómo funciona?
            </Link>
            <Link href="#faq" className="text-gray-600 hover:text-primary">
              FAQ
            </Link>
          </nav>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white to-background-secondary">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6">
              Invierte en proyectos inmobiliarios desde{' '}
              <span className="text-primary">$5.000.000</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Accede a inversiones inmobiliarias de alto valor con rentabilidades
              superiores al depósito a plazo. Diversifica tu portafolio de forma simple y segura.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/proyectos">
                <Button size="lg" className="w-full sm:w-auto">
                  Ver Proyectos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  ¿Cómo funciona?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">$21.2B</p>
              <p className="text-gray-600 mt-2">Capital Recaudado</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">$1.3B</p>
              <p className="text-gray-600 mt-2">Intereses Pagados</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">70+</p>
              <p className="text-gray-600 mt-2">Proyectos Completados</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">2,500+</p>
              <p className="text-gray-600 mt-2">Inversionistas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="section-padding bg-background-secondary">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Proyectos Destacados
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explora nuestros proyectos inmobiliarios seleccionados con las mejores
              oportunidades de inversión.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects?.results?.slice(0, 3).map((project: Project) => (
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
                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {project.title}
                </h3>
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min(parseFloat(project.funding_progress), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatPercent(parseFloat(project.funding_progress))} financiado</span>
                    <span>{project.investor_count} inversionistas</span>
                  </div>
                </div>

                <Link href={`/proyectos/${project.slug}`}>
                  <Button className="w-full mt-4">Ver Proyecto</Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/proyectos">
              <Button variant="secondary" size="lg">
                Ver Todos los Proyectos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Invertir en proyectos inmobiliarios nunca fue tan fácil.
              Sigue estos simples pasos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Crea tu Cuenta
              </h3>
              <p className="text-gray-600">
                Regístrate gratis y completa tu verificación de identidad (KYC)
                para comenzar a invertir.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Elige un Proyecto
              </h3>
              <p className="text-gray-600">
                Explora nuestros proyectos inmobiliarios y elige el que mejor
                se adapte a tus objetivos.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Invierte y Gana
              </h3>
              <p className="text-gray-600">
                Realiza tu inversión y recibe rentabilidad al finalizar
                el proyecto (12 meses).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-background-secondary">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-secondary mb-2">
                Proyectos Seleccionados
              </h3>
              <p className="text-gray-600 text-sm">
                Evaluamos cada proyecto para ofrecerte las mejores oportunidades.
              </p>
            </div>
            <div className="card text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-secondary mb-2">
                Alta Rentabilidad
              </h3>
              <p className="text-gray-600 text-sm">
                Obtén retornos superiores a los instrumentos tradicionales.
              </p>
            </div>
            <div className="card text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-secondary mb-2">
                Invertimos Juntos
              </h3>
              <p className="text-gray-600 text-sm">
                Nuestro equipo invierte en cada proyecto junto a ti.
              </p>
            </div>
            <div className="card text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-secondary mb-2">
                Gestión Directa
              </h3>
              <p className="text-gray-600 text-sm">
                Gestionamos directamente cada proyecto para maximizar resultados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary text-center mb-12">
            Preguntas Frecuentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="card group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-secondary">{faq.question}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-gray-600 mt-4">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para empezar a invertir?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Únete a miles de inversionistas que ya están generando rentabilidad
            con proyectos inmobiliarios.
          </p>
          <Link href="/registro">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Crear Cuenta Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SomosRentable</h3>
              <p className="text-gray-300 text-sm">
                Plataforma de crowdfunding inmobiliario líder en Chile.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/proyectos" className="hover:text-white">Proyectos</Link></li>
                <li><Link href="#como-funciona" className="hover:text-white">¿Cómo funciona?</Link></li>
                <li><Link href="#faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/terminos" className="hover:text-white">Términos y Condiciones</Link></li>
                <li><Link href="/privacidad" className="hover:text-white">Política de Privacidad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>contacto@somosrentable.com</li>
                <li>+56 2 1234 5678</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} SomosRentable. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const faqs = [
  {
    question: '¿Cuál es la inversión mínima?',
    answer: 'La inversión mínima varía según el proyecto, generalmente desde $5.000.000 CLP. Puedes ver el monto mínimo específico en la página de cada proyecto.',
  },
  {
    question: '¿Cuánto dura una inversión?',
    answer: 'Los proyectos tienen una duración de 12 meses. Al finalizar, recibirás tu capital invertido más la rentabilidad generada.',
  },
  {
    question: '¿Qué rentabilidad puedo esperar?',
    answer: 'Las rentabilidades varían entre 11% y 16% anual dependiendo del proyecto. Cada proyecto tiene su tasa de retorno específica que puedes ver antes de invertir.',
  },
  {
    question: '¿Cómo funciona el proceso de verificación (KYC)?',
    answer: 'El proceso KYC es simple: solo necesitas subir una foto de tu documento de identidad y tu nombre completo. El proceso toma solo unos minutos.',
  },
  {
    question: '¿Es seguro invertir?',
    answer: 'Sí. Cada proyecto es evaluado rigurosamente por nuestro equipo. Además, nuestro equipo invierte en cada proyecto junto contigo, alineando nuestros intereses.',
  },
]
