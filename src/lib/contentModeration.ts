import { supabase } from './supabaseClient';

// Lista de palabras prohibidas en español
const prohibitedWords = [
  // Groserías comunes
  'pendejo', 'cabrón', 'cabron', 'hijueputa', 'hijuemadre', 'malparido', 'gonorrea', 'verga',
  'puto', 'puta', 'zorra', 'perra', 'marica', 'maricón', 'maricon', 'joto', 'culero',
  'mamón', 'mamon', 'gilipollas', 'imbécil', 'imbecil', 'idiota', 'estúpido', 'estupido',
  'mierda', 'cagada', 'cagar', 'cagón', 'cagon', 'coño', 'coño', 'joder', 'jodido',
  
  // Insultos raciales y discriminatorios
  'negro', 'indio', 'cholo', 'naco', 'nacos', 'prole', 'proles', 'indigente', 'indígena',
  'mongólico', 'mongolico', 'retrasado', 'retrasada', 'discapacitado', 'loco', 'loca',
  
  // Contenido sexual explícito
  'porno', 'pornografía', 'pornografia', 'masturbación', 'masturbacion', 'sexo', 'sexual',
  'violación', 'violacion', 'violador', 'violadora', 'acoso', 'acosar', 'prostituta',
  'prostituto', 'escort', 'gigolo', 'pene', 'vagina', 'senos', 'nalgas', 'culo',
  
  // Drogas y sustancias
  'droga', 'drogas', 'marihuana', 'cocaína', 'cocaina', 'crack', 'heroína', 'heroina',
  'éxtasis', 'extasis', 'lsd', 'metanfetamina', 'anfetamina', 'perico', 'bazuco',
  'porro', 'porros', 'fumanchú', 'fumón', 'fumon', 'drogadicto', 'drogadicta',
  
  // Violencia y amenazas
  'matar', 'asesinar', 'homicidio', 'suicidio', 'golpear', 'golpiza', 'torturar',
  'tortura', 'secuestrar', 'secuestro', 'violencia', 'violento', 'violenta',
  'amenaza', 'amenazar', 'balacera', 'balazo', 'pistola', 'arma', 'armado',
  
  // Actividades ilegales
  'robar', 'robo', 'hurto', 'ladrón', 'ladron', 'ratero', 'ratera', 'estafa',
  'estafar', 'estafador', 'estafadora', 'fraude', 'fraudulento', 'ilegal',
  'contrabando', 'contrabandista', 'criminal', 'delincuente', 'delincuencia',
  
  // Hate speech
  'odio', 'odiar', 'desprecio', 'despreciar', 'discriminar', 'discriminación',
  'discriminacion', 'racismo', 'racista', 'xenofobia', 'xenófobo', 'xenofobo',
  'homofobia', 'homofóbico', 'homofobico', 'transfobia', 'transfóbico', 'transfobico'
];

// Patrones de comportamiento sospechoso
const suspiciousPatterns = [
  // Múltiples signos de exclamación o interrogación
  /[!]{3,}|[?]{3,}/g,
  // Texto en mayúsculas (gritar)
  /[A-ZÁÉÍÓÚÑ]{10,}/g,
  // Números de teléfono
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  // URLs
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  // Emails
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Palabras con repetición excesiva de letras
  /\b\w*([a-zA-Z])\1{2,}\w*\b/g,
  // Espacios excesivos entre caracteres
  /\b\w(\s+\w){4,}\b/g
];

export interface ContentModerationResult {
  isAllowed: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
  detectedIssues: string[];
  filteredContent?: string;
}

export function moderateContent(content: string): ContentModerationResult {
  const originalContent = content;
  let filteredContent = content.toLowerCase();
  const detectedIssues: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' = 'low';

  // Verificar palabras prohibidas
  const foundProhibitedWords = prohibitedWords.filter(word => 
    filteredContent.includes(word.toLowerCase())
  );

  if (foundProhibitedWords.length > 0) {
    detectedIssues.push(`Palabras prohibidas: ${foundProhibitedWords.join(', ')}`);
    maxSeverity = 'high';
    
    // Censurar palabras prohibidas
    foundProhibitedWords.forEach(word => {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    });
  }

  // Verificar patrones sospechosos
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(originalContent)) {
      switch (index) {
        case 0:
          detectedIssues.push('Exceso de signos de exclamación/interrogación');
          maxSeverity = maxSeverity === 'low' ? 'medium' : maxSeverity;
          break;
        case 1:
          detectedIssues.push('Texto en mayúsculas excesivo');
          maxSeverity = maxSeverity === 'low' ? 'medium' : maxSeverity;
          break;
        case 2:
          detectedIssues.push('Número de teléfono detectado');
          maxSeverity = 'high';
          break;
        case 3:
          detectedIssues.push('URL detectada');
          maxSeverity = 'high';
          break;
        case 4:
          detectedIssues.push('Email detectado');
          maxSeverity = 'high';
          break;
        case 5:
          detectedIssues.push('Repetición excesiva de letras');
          maxSeverity = maxSeverity === 'low' ? 'medium' : maxSeverity;
          break;
        case 6:
          detectedIssues.push('Formato de texto sospechoso');
          maxSeverity = maxSeverity === 'low' ? 'medium' : maxSeverity;
          break;
      }
    }
  });

  // Determinar si el contenido es permitido
  const isAllowed = maxSeverity !== 'high';

  return {
    isAllowed,
    reason: detectedIssues.length > 0 ? detectedIssues.join('; ') : undefined,
    severity: maxSeverity,
    detectedIssues,
    filteredContent: isAllowed ? originalContent : filteredContent
  };
}

// Función para reportar contenido
export async function reportContent(
  reporterId: string,
  contentType: 'message' | 'profile' | 'trip',
  contentId: number,
  reason: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: reporterId,
        content_type: contentType,
        content_id: contentId,
        reason,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error reporting content:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error reporting content:', error);
    return { success: false, error: 'Error inesperado al reportar contenido' };
  }
}

// Función para bloquear usuario
export async function blockUser(
  blockerId: string,
  blockedId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error blocking user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error blocking user:', error);
    return { success: false, error: 'Error inesperado al bloquear usuario' };
  }
}

// Función para verificar si un usuario está bloqueado
export async function isUserBlocked(
  userId: string,
  checkAgainstId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${checkAgainstId}),and(blocker_id.eq.${checkAgainstId},blocked_id.eq.${userId})`)
      .limit(1);

    if (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Unexpected error checking user block:', error);
    return false;
  }
}

// Función para obtener usuarios bloqueados
export async function getBlockedUsers(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);

    if (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }

    return data?.map(block => block.blocked_id) || [];
  } catch (error) {
    console.error('Unexpected error getting blocked users:', error);
    return [];
  }
}

// Función para desbloquear usuario
export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) {
      console.error('Error unblocking user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error unblocking user:', error);
    return { success: false, error: 'Error inesperado al desbloquear usuario' };
  }
}

// Función para obtener reportes pendientes (para moderadores)
export async function getPendingReports(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('content_reports')
      .select(`
        *,
        reporter:user_profiles!content_reports_reporter_id_fkey(
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending reports:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error getting pending reports:', error);
    return [];
  }
}

// Función para resolver reporte
export async function resolveReport(
  reportId: number,
  moderatorId: string,
  action: 'dismissed' | 'content_removed' | 'user_warned' | 'user_suspended',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('content_reports')
      .update({
        status: 'resolved',
        resolved_by: moderatorId,
        resolution_action: action,
        resolution_notes: notes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) {
      console.error('Error resolving report:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error resolving report:', error);
    return { success: false, error: 'Error inesperado al resolver reporte' };
  }
}
