'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kycApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { KYCStatus } from '@/types'
import {
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  AlertCircle,
  Camera
} from 'lucide-react'

export default function KYCPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, fetchUser } = useAuth()

  const [formData, setFormData] = useState({
    full_name: user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : '',
  })
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentPreview, setDocumentPreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  const { data: kycStatus, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus(),
  })

  const submitMutation = useMutation({
    mutationFn: (formData: FormData) => kycApi.submit(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] })
      fetchUser()
    },
    onError: (err: any) => {
      const errors = err.response?.data
      if (errors) {
        const firstError = Object.values(errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      } else {
        setError('Error al enviar la verificación')
      }
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocumentFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.full_name.trim()) {
      setError('Por favor ingresa tu nombre completo')
      return
    }

    if (!documentFile) {
      setError('Por favor sube una foto de tu documento')
      return
    }

    const data = new FormData()
    data.append('full_name', formData.full_name)
    data.append('document_photo', documentFile)

    submitMutation.mutate(data)
  }

  const kyc: KYCStatus = kycStatus || { has_submission: false, is_verified: false, can_submit: true }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Already verified
  if (kyc.is_verified) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secondary mb-2">
            Identidad Verificada
          </h1>
          <p className="text-gray-500 mb-6">
            Tu identidad ha sido verificada exitosamente. Ya puedes invertir en proyectos.
          </p>
          <Button onClick={() => router.push('/proyectos')}>
            Explorar Proyectos
          </Button>
        </div>
      </div>
    )
  }

  // Pending review
  if (kyc.submission?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secondary mb-2">
            Verificación en Proceso
          </h1>
          <p className="text-gray-500 mb-2">
            Estamos revisando tus documentos. Este proceso puede tomar unos minutos.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Enviado el {new Date(kyc.submission.created_at).toLocaleDateString('es-CL')}
          </p>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Rejected - can resubmit
  const isRejected = kyc.submission?.status === 'rejected'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary">
          Verificación de Identidad (KYC)
        </h1>
        <p className="text-gray-500">
          Para poder invertir, necesitamos verificar tu identidad.
        </p>
      </div>

      {isRejected && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">
                Verificación Rechazada
              </h3>
              <p className="text-sm text-red-600">
                {kyc.submission?.rejection_reason || 'Tu verificación anterior fue rechazada. Por favor, intenta nuevamente con documentos válidos.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Visual Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-primary-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-secondary mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Cómo tomar una buena foto
            </h3>

            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Buena iluminación</p>
                <p className="text-xs text-gray-500 mt-1">Sin sombras ni reflejos</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Documento completo</p>
                <p className="text-xs text-gray-500 mt-1">Todos los bordes visibles</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Imagen nítida</p>
                <p className="text-xs text-gray-500 mt-1">Texto legible claramente</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-gray-600 bg-white/50 p-3 rounded-lg">
              <FileCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Documentos aceptados:</p>
                <p>Cédula de identidad o Pasaporte vigente</p>
                <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG • Máximo: 5MB</p>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Como aparece en tu documento"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto del Documento *
            </label>
            <div className="mt-1">
              {documentPreview ? (
                <div className="relative">
                  <img
                    src={documentPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentFile(null)
                      setDocumentPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors bg-gray-50">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Camera className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-primary font-medium">Haz clic para subir</span> o arrastra una imagen
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG o JPEG (máx. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Verificación
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Al enviar, confirmas que la información proporcionada es correcta y que el documento es auténtico.
          </p>
        </form>
      </div>
    </div>
  )
}
