// Exportar todos los servicios de moderación y gestión de cuentas
export * from './moderation';
export * from './accounts';

// Re-exportar hooks relacionados
export { useUserModeration } from '@/hooks/useUserModeration';

// Re-exportar componentes de moderación
export { ReportModal } from '@/components/ReportModal';
export { BlockUserModal } from '@/components/BlockUserModal';
export { BlockedUsersModal } from '@/components/BlockedUsersModal';
export { ModerationDashboard } from '@/components/ModerationDashboard';
export { DeactivateAccountModal } from '@/components/DeactivateAccountModal';
export { RecoverAccountModal } from '@/components/RecoverAccountModal';
export { CheckAccountStatusModal } from '@/components/CheckAccountStatusModal';
export { UserModerationModal } from '@/components/UserModerationModal';
export { ModerationStatusDisplay } from '@/components/ModerationStatusDisplay';
export { ReportsSystemTest } from '@/components/ReportsSystemTest';

// Re-exportar utilidades
export { testReportsEndpoint, debugReportData, debugMessageInfo } from '@/utils/reportDebug';
