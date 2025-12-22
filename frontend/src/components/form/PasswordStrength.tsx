'use client'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return Math.min(strength, 4)
  }

  const strength = getStrength(password)

  const getColor = () => {
    if (strength <= 1) return 'bg-red-500'
    if (strength === 2) return 'bg-yellow-500'
    if (strength === 3) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getLabel = () => {
    if (strength <= 1) return 'Débil'
    if (strength === 2) return 'Regular'
    if (strength === 3) return 'Buena'
    return 'Fuerte'
  }

  const getLabelColor = () => {
    if (strength <= 1) return 'text-red-600'
    if (strength === 2) return 'text-yellow-600'
    if (strength === 3) return 'text-blue-600'
    return 'text-green-600'
  }

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength ? getColor() : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${getLabelColor()}`}>
        Contraseña: {getLabel()}
      </p>
    </div>
  )
}

interface PasswordMatchProps {
  password: string
  confirmPassword: string
}

export function PasswordMatch({ password, confirmPassword }: PasswordMatchProps) {
  if (!confirmPassword) return null

  const isMatch = password === confirmPassword

  return (
    <p className={`text-xs mt-1 ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
      {isMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
    </p>
  )
}
