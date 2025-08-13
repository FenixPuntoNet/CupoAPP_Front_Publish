export interface ErrorInfo {
  title: string;
  message: string;
  color: 'red' | 'orange' | 'yellow';
  icon: string;
}

/**
 * Mapea errores del backend a mensajes amigables para el usuario
 */
export function mapBackendError(error: string): ErrorInfo {
  // Errores de autenticación
  if (error.includes('Invalid login credentials') || error.includes('Credenciales inválidas')) {
    return {
      title: 'Credenciales incorrectas',
      message: 'El correo electrónico o la contraseña no son correctos. Por favor, verifica tus datos.',
      color: 'red',
      icon: '🔐'
    };
  }

  if (error.includes('Email y contraseña son requeridos')) {
    return {
      title: 'Datos incompletos',
      message: 'Por favor, ingresa tu correo electrónico y contraseña.',
      color: 'orange',
      icon: '⚠️'
    };
  }

  if (error.includes('Formato de email inválido')) {
    return {
      title: 'Correo inválido',
      message: 'Por favor, ingresa un correo electrónico válido.',
      color: 'orange',
      icon: '📧'
    };
  }

  // Errores de cuenta
  if (error.includes('temporarily_deactivated') || error.includes('temporalmente desactivada')) {
    return {
      title: 'Cuenta desactivada',
      message: 'Tu cuenta está temporalmente desactivada. Puedes reactivarla en "Recuperar cuenta".',
      color: 'orange',
      icon: '⏸️'
    };
  }

  if (error.includes('pending_deletion') || error.includes('pendiente de eliminación')) {
    return {
      title: 'Cuenta programada para eliminación',
      message: 'Tu cuenta está programada para eliminarse. Puedes recuperarla en "Recuperar cuenta".',
      color: 'orange',
      icon: '🗑️'
    };
  }

  if (error.includes('deactivated') || error.includes('desactivada')) {
    return {
      title: 'Cuenta desactivada',
      message: 'Tu cuenta ha sido desactivada. Contacta con soporte o intenta recuperarla.',
      color: 'orange',
      icon: '🚫'
    };
  }

  // Errores de red
  if (error.includes('Network Error') || error.includes('fetch')) {
    return {
      title: 'Error de conexión',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      color: 'orange',
      icon: '🌐'
    };
  }

  if (error.includes('timeout') || error.includes('TIMEOUT')) {
    return {
      title: 'Tiempo agotado',
      message: 'La conexión tardó demasiado. Intenta nuevamente.',
      color: 'yellow',
      icon: '⏱️'
    };
  }

  // Errores del servidor
  if (error.includes('Internal Server Error') || error.includes('Error interno')) {
    return {
      title: 'Error del servidor',
      message: 'Ocurrió un error en el servidor. Intenta nuevamente en unos momentos.',
      color: 'red',
      icon: '🔧'
    };
  }

  if (error.includes('Service Unavailable') || error.includes('unavailable')) {
    return {
      title: 'Servicio no disponible',
      message: 'El servicio está temporalmente no disponible. Intenta más tarde.',
      color: 'orange',
      icon: '🔧'
    };
  }

  // Errores de sesión
  if (error.includes('Token expired') || error.includes('expired')) {
    return {
      title: 'Sesión expirada',
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      color: 'yellow',
      icon: '⏰'
    };
  }

  if (error.includes('No autenticado') || error.includes('Unauthorized')) {
    return {
      title: 'No autorizado',
      message: 'No tienes autorización para realizar esta acción.',
      color: 'red',
      icon: '🔒'
    };
  }

  // Error genérico
  return {
    title: 'Error inesperado',
    message: error || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    color: 'red',
    icon: '❌'
  };
}

/**
 * Mapea errores de validación del frontend
 */
export function mapValidationError(field: string, value: string): ErrorInfo | null {
  if (field === 'email') {
    if (!value) {
      return {
        title: 'Correo requerido',
        message: 'Por favor, ingresa tu correo electrónico.',
        color: 'orange',
        icon: '📧'
      };
    }
    if (!/^\S+@\S+$/.test(value)) {
      return {
        title: 'Correo inválido',
        message: 'Por favor, ingresa un correo electrónico válido.',
        color: 'orange',
        icon: '📧'
      };
    }
  }

  if (field === 'password') {
    if (!value) {
      return {
        title: 'Contraseña requerida',
        message: 'Por favor, ingresa tu contraseña.',
        color: 'orange',
        icon: '🔐'
      };
    }
    if (value.length < 6) {
      return {
        title: 'Contraseña muy corta',
        message: 'La contraseña debe tener al menos 6 caracteres.',
        color: 'orange',
        icon: '🔐'
      };
    }
  }

  return null;
}
