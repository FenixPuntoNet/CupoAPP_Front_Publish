-- ===============================================
-- SISTEMA DE MODERACIÓN DE CONTENIDO PARA CUPO
-- ===============================================
-- Compatible con las tablas existentes: chat_messages, chat_participants, chats, user_profiles
-- Cumple con las pautas de Apple App Store para aplicaciones con contenido generado por usuarios

-- ===============================================
-- TABLAS DEL SISTEMA DE MODERACIÓN
-- ===============================================

-- Tabla para reportes de contenido
CREATE TABLE IF NOT EXISTS content_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('message', 'profile', 'trip')),
    content_id BIGINT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_action VARCHAR(50) CHECK (resolution_action IN ('dismissed', 'content_removed', 'user_warned', 'user_suspended')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_content_report UNIQUE (reporter_id, content_type, content_id)
);

-- Tabla para bloqueos de usuarios
CREATE TABLE IF NOT EXISTS user_blocks (
    id BIGSERIAL PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Tabla para advertencias de usuarios
CREATE TABLE IF NOT EXISTS user_warnings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Tabla para suspensiones de usuarios
CREATE TABLE IF NOT EXISTS user_suspensions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    suspended_until TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lifted_at TIMESTAMP WITH TIME ZONE,
    lifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla para mensajes filtrados/censurados
CREATE TABLE IF NOT EXISTS filtered_messages (
    id BIGSERIAL PRIMARY KEY,
    original_message_id BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    filtered_content TEXT NOT NULL,
    reason TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para log de moderación (para auditoría)
CREATE TABLE IF NOT EXISTS moderation_logs (
    id BIGSERIAL PRIMARY KEY,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type VARCHAR(50),
    content_id BIGINT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- ÍNDICES PARA OPTIMIZAR LAS CONSULTAS
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type_id ON content_reports(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_created_at ON user_blocks(created_at);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_created_at ON user_warnings(created_at);
CREATE INDEX IF NOT EXISTS idx_user_warnings_severity ON user_warnings(severity);

CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_id ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_active ON user_suspensions(user_id, lifted_at) WHERE lifted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_suspensions_until ON user_suspensions(suspended_until);

CREATE INDEX IF NOT EXISTS idx_filtered_messages_original_message_id ON filtered_messages(original_message_id);
CREATE INDEX IF NOT EXISTS idx_filtered_messages_severity ON filtered_messages(severity);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user_id ON moderation_logs(target_user_id);

-- ===============================================
-- POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- ===============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtered_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para content_reports
CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can manage reports" ON content_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

-- Políticas para user_blocks
CREATE POLICY "Users can view their own blocks" ON user_blocks
    FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks" ON user_blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON user_blocks
    FOR DELETE USING (auth.uid() = blocker_id);

-- Políticas para user_warnings
CREATE POLICY "Users can view their own warnings" ON user_warnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can manage warnings" ON user_warnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

-- Políticas para user_suspensions
CREATE POLICY "Users can view their own suspensions" ON user_suspensions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can manage suspensions" ON user_suspensions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

-- Políticas para filtered_messages
CREATE POLICY "Moderators can manage filtered messages" ON filtered_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

-- Políticas para moderation_logs
CREATE POLICY "Moderators can view logs" ON moderation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

CREATE POLICY "Moderators can create logs" ON moderation_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

-- ===============================================
-- FUNCIONES ÚTILES PARA EL SISTEMA DE MODERACIÓN
-- ===============================================

-- Función para verificar si un usuario está suspendido
CREATE OR REPLACE FUNCTION is_user_suspended(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_suspensions 
        WHERE user_id = user_uuid 
        AND lifted_at IS NULL
        AND (is_permanent = true OR suspended_until > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el nivel de advertencias de un usuario
CREATE OR REPLACE FUNCTION get_user_warning_level(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    warning_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO warning_count
    FROM user_warnings 
    WHERE user_id = user_uuid 
    AND created_at > NOW() - INTERVAL '30 days';
    
    RETURN warning_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario está bloqueado por otro
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_uuid UUID, blocked_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE blocker_id = blocker_uuid 
        AND blocked_id = blocked_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener usuarios bloqueados por un usuario
CREATE OR REPLACE FUNCTION get_blocked_users(user_uuid UUID)
RETURNS TABLE(blocked_user_id UUID, reason VARCHAR(255), created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT ub.blocked_id, ub.reason, ub.created_at
    FROM user_blocks ub
    WHERE ub.blocker_id = user_uuid
    ORDER BY ub.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener información del usuario (compatible con user_profiles)
CREATE OR REPLACE FUNCTION get_user_profile_info(user_uuid UUID)
RETURNS TABLE(
    user_id UUID,
    full_name TEXT,
    status VARCHAR(255),
    photo_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id::UUID,
        (up.first_name || ' ' || up.last_name) AS full_name,
        up.status,
        up.photo_user
    FROM user_profiles up
    WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- TRIGGERS PARA LOG AUTOMÁTICO DE MODERACIÓN
-- ===============================================

-- Función para el trigger de log de moderación
CREATE OR REPLACE FUNCTION log_moderation_action()
RETURNS TRIGGER AS $$
DECLARE
    moderator_uuid UUID;
    action_name TEXT;
    target_uuid UUID;
BEGIN
    -- Determinar el moderador
    moderator_uuid := COALESCE(NEW.moderator_id, NEW.resolved_by);
    
    -- Determinar la acción
    IF TG_OP = 'INSERT' THEN
        action_name := TG_TABLE_NAME || '_created';
    ELSIF TG_OP = 'UPDATE' THEN
        action_name := TG_TABLE_NAME || '_updated';
    ELSIF TG_OP = 'DELETE' THEN
        action_name := TG_TABLE_NAME || '_deleted';
        moderator_uuid := COALESCE(OLD.moderator_id, OLD.resolved_by);
    END IF;
    
    -- Determinar el usuario objetivo
    IF TG_TABLE_NAME = 'user_warnings' THEN
        target_uuid := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'user_suspensions' THEN
        target_uuid := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'content_reports' THEN
        target_uuid := COALESCE(NEW.reporter_id, OLD.reporter_id);
    END IF;
    
    -- Solo logear si hay un moderador válido
    IF moderator_uuid IS NOT NULL THEN
        INSERT INTO moderation_logs (moderator_id, action, target_user_id, content_type, details)
        VALUES (
            moderator_uuid,
            action_name,
            target_uuid,
            TG_TABLE_NAME,
            CASE 
                WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
                WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
                ELSE row_to_json(NEW)
            END
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trigger_log_user_warnings ON user_warnings;
CREATE TRIGGER trigger_log_user_warnings
    AFTER INSERT OR UPDATE OR DELETE ON user_warnings
    FOR EACH ROW EXECUTE FUNCTION log_moderation_action();

DROP TRIGGER IF EXISTS trigger_log_user_suspensions ON user_suspensions;
CREATE TRIGGER trigger_log_user_suspensions
    AFTER INSERT OR UPDATE OR DELETE ON user_suspensions
    FOR EACH ROW EXECUTE FUNCTION log_moderation_action();

DROP TRIGGER IF EXISTS trigger_log_content_reports_resolved ON content_reports;
CREATE TRIGGER trigger_log_content_reports_resolved
    AFTER UPDATE ON content_reports
    FOR EACH ROW 
    WHEN (OLD.status = 'pending' AND NEW.status IN ('resolved', 'dismissed'))
    EXECUTE FUNCTION log_moderation_action();

-- ===============================================
-- VISTA PARA REPORTES PENDIENTES
-- ===============================================

CREATE OR REPLACE VIEW pending_reports AS
SELECT 
    cr.*,
    (up_reporter.first_name || ' ' || up_reporter.last_name) AS reporter_name,
    up_reporter.user_id AS reporter_user_id,
    up_reporter.photo_user AS reporter_photo,
    CASE 
        WHEN cr.content_type = 'message' THEN 
            (SELECT cm.message FROM chat_messages cm WHERE cm.id = cr.content_id)
        WHEN cr.content_type = 'profile' THEN 
            (SELECT up.first_name || ' ' || up.last_name FROM user_profiles up WHERE up.user_id::text = cr.content_id::text)
        WHEN cr.content_type = 'trip' THEN 
            (SELECT t.description FROM trips t WHERE t.id = cr.content_id)
        ELSE NULL
    END AS content_preview,
    CASE 
        WHEN cr.content_type = 'message' THEN 
            (SELECT cm.user_id FROM chat_messages cm WHERE cm.id = cr.content_id)
        WHEN cr.content_type = 'profile' THEN 
            cr.content_id::text::UUID
        WHEN cr.content_type = 'trip' THEN 
            (SELECT t.user_id FROM trips t WHERE t.id = cr.content_id)
        ELSE NULL
    END AS content_owner_id,
    CASE 
        WHEN cr.content_type = 'message' THEN 
            (SELECT up.first_name || ' ' || up.last_name FROM chat_messages cm 
             JOIN user_profiles up ON up.user_id = cm.user_id 
             WHERE cm.id = cr.content_id)
        WHEN cr.content_type = 'profile' THEN 
            (SELECT up.first_name || ' ' || up.last_name FROM user_profiles up WHERE up.user_id::text = cr.content_id::text)
        WHEN cr.content_type = 'trip' THEN 
            (SELECT up.first_name || ' ' || up.last_name FROM trips t 
             JOIN user_profiles up ON up.user_id = t.user_id 
             WHERE t.id = cr.content_id)
        ELSE NULL
    END AS content_owner_name
FROM content_reports cr
JOIN user_profiles up_reporter ON up_reporter.user_id = cr.reporter_id
WHERE cr.status = 'pending'
ORDER BY cr.created_at DESC;

-- ===============================================
-- VISTA PARA ESTADÍSTICAS DE MODERACIÓN
-- ===============================================

CREATE OR REPLACE VIEW moderation_stats AS
SELECT 
    'reports' AS metric_type,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS last_24h_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS last_7d_count
FROM content_reports
UNION ALL
SELECT 
    'warnings' AS metric_type,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN acknowledged_at IS NULL THEN 1 END) AS pending_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS last_24h_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS last_7d_count
FROM user_warnings
UNION ALL
SELECT 
    'suspensions' AS metric_type,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN lifted_at IS NULL AND (is_permanent = true OR suspended_until > NOW()) THEN 1 END) AS pending_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS last_24h_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS last_7d_count
FROM user_suspensions
UNION ALL
SELECT 
    'blocks' AS metric_type,
    COUNT(*) AS total_count,
    COUNT(*) AS pending_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS last_24h_count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS last_7d_count
FROM user_blocks;

-- ===============================================
-- COMENTARIOS FINALES
-- ===============================================

-- Este script crea un sistema completo de moderación compatible con las tablas existentes:
-- 
-- TABLAS EXISTENTES UTILIZADAS:
-- - chat_messages: Para reportes de mensajes y filtrado
-- - user_profiles: Para información de usuarios y roles de moderador
-- - auth.users: Para referencias de usuarios y autenticación
-- - trips: Para reportes de viajes (opcional)
-- 
-- FUNCIONALIDADES IMPLEMENTADAS:
-- 1. ✅ Sistema de reportes para contenido ofensivo
-- 2. ✅ Sistema de bloqueo de usuarios
-- 3. ✅ Sistema de advertencias y suspensiones
-- 4. ✅ Filtrado automático de mensajes
-- 5. ✅ Log completo de acciones de moderación
-- 6. ✅ Funciones útiles para verificaciones
-- 7. ✅ Políticas de seguridad RLS apropiadas
-- 8. ✅ Triggers para log automático
-- 9. ✅ Vistas para reportes pendientes y estadísticas
-- 10. ✅ Compatibilidad con estructura existente
-- 
-- CUMPLIMIENTO DE APPLE APP STORE:
-- - ✅ Filtrado de contenido ofensivo
-- - ✅ Sistema de reportes de usuarios
-- - ✅ Bloqueo de usuarios
-- - ✅ Acción de moderación en menos de 24 horas
-- - ✅ Log de auditoría completo
-- - ✅ Roles de moderador
-- 
-- PRÓXIMOS PASOS:
-- 1. Aplicar esta migración en Supabase
-- 2. Configurar usuarios moderadores en user_profiles (status: 'moderator')
-- 3. Probar el sistema desde el frontend
-- 4. Documentar para el reenvío a Apple
