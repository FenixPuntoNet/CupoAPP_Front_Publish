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

-- Tabla para log de moderación
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

-- Tabla para mensajes filtrados/censurados
CREATE TABLE IF NOT EXISTS filtered_messages (
    id BIGSERIAL PRIMARY KEY,
    original_message_id BIGINT NOT NULL,
    original_content TEXT NOT NULL,
    filtered_content TEXT NOT NULL,
    reason TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_id ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_filtered_messages_original_message_id ON filtered_messages(original_message_id);

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtered_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para content_reports
CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON content_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

CREATE POLICY "Moderators can update reports" ON content_reports
    FOR UPDATE USING (
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

CREATE POLICY "Moderators can view all warnings" ON user_warnings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

CREATE POLICY "Moderators can create warnings" ON user_warnings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

-- Políticas para user_suspensions
CREATE POLICY "Users can view their own suspensions" ON user_suspensions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all suspensions" ON user_suspensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

CREATE POLICY "Moderators can create suspensions" ON user_suspensions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

CREATE POLICY "Moderators can update suspensions" ON user_suspensions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND status = 'moderator'
        )
    );

-- Políticas para moderation_logs
CREATE POLICY "Moderators can view all logs" ON moderation_logs
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

-- Políticas para filtered_messages
CREATE POLICY "System can manage filtered messages" ON filtered_messages
    FOR ALL USING (true);

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

-- Trigger para log automático de moderación
CREATE OR REPLACE FUNCTION log_moderation_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO moderation_logs (moderator_id, action, target_user_id, content_type, details)
        VALUES (
            COALESCE(NEW.moderator_id, NEW.resolved_by),
            TG_TABLE_NAME || '_created',
            CASE 
                WHEN TG_TABLE_NAME = 'user_warnings' THEN NEW.user_id
                WHEN TG_TABLE_NAME = 'user_suspensions' THEN NEW.user_id
                ELSE NULL
            END,
            TG_TABLE_NAME,
            row_to_json(NEW)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_log_user_warnings
    AFTER INSERT ON user_warnings
    FOR EACH ROW EXECUTE FUNCTION log_moderation_action();

CREATE TRIGGER trigger_log_user_suspensions
    AFTER INSERT ON user_suspensions
    FOR EACH ROW EXECUTE FUNCTION log_moderation_action();

CREATE TRIGGER trigger_log_content_reports_resolved
    AFTER UPDATE ON content_reports
    FOR EACH ROW 
    WHEN (OLD.status = 'pending' AND NEW.status = 'resolved')
    EXECUTE FUNCTION log_moderation_action();
