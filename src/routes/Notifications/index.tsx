import React from 'react'
import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Text,
  LoadingOverlay,
  Modal,
  Button,
} from '@mantine/core'
import {
  Bell,
  MessageCircle,
  Ticket,
  Car,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import styles from './index.module.css'
import { useNotifications } from '@/hooks/useNotifications'
import { DatabaseNotification } from '@/types/notifications'
import BackButton from '@/components/Buttons/backButton'
import NotificationDataDisplay from '@/components/NotificationDataDisplay'

interface NotificationFilter {
  all: boolean
  unread: boolean
  messages: boolean
  bookings: boolean
  trips: boolean
}

const NotificationsCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    markAllAsUnread,
    stats,
    hasRead
  } = useNotifications()

  const [filteredNotifications, setFilteredNotifications] = useState<DatabaseNotification[]>([])
  const [activeFilter, setActiveFilter] = useState<keyof NotificationFilter>('all')
  const [selectedNotification, setSelectedNotification] = useState<DatabaseNotification | null>(null)

  // 🔄 Actualizar notificaciones filtradas cuando cambian los datos o filtros
  useEffect(() => {
    let filtered = [...notifications]

    switch (activeFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.is_read)
        break
      case 'messages':
        filtered = notifications.filter(n => n.type === 'message')
        break
      case 'bookings':
        filtered = notifications.filter(n => n.type === 'booking')
        break
      case 'trips':
        filtered = notifications.filter(n => n.type === 'trip' || n.type === 'confirmation')
        break
      case 'all':
      default:
        // No filtro, mostrar todas
        break
    }

    setFilteredNotifications(filtered)
  }, [notifications, activeFilter])

  // 🎨 Obtener icono según tipo de notificación
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return MessageCircle
      case 'booking': return Ticket
      case 'confirmation': return CheckCircle
      case 'trip': return Car
      case 'warning': return AlertTriangle
      default: return Bell
    }
  }

  // 🎨 Obtener color según tipo
  const getNotificationColor = (type: string, isRead: boolean) => {
    const baseColors = {
      message: '#00cc7d',
      booking: '#ff922b', 
      confirmation: '#00ff9d',
      trip: '#9775fa',
      warning: '#ffd43b',
      default: '#868e96'
    }
    
    const color = baseColors[type as keyof typeof baseColors] || baseColors.default
    return isRead ? `${color}60` : color // Más transparente si está leída
  }

  // 🎯 Manejar click en notificación
  const handleNotificationClick = async (notification: DatabaseNotification) => {
    // Solo mostrar detalles, no cambiar estado automáticamente
    setSelectedNotification(notification)
  }

  // 👁️ Manejar click en botón de cambio de estado
  const handleToggleReadState = async (e: React.MouseEvent, notification: DatabaseNotification) => {
    e.stopPropagation() // Prevenir que abra el modal
    
    if (notification.is_read) {
      await markAsUnread(notification.id)
    } else {
      await markAsRead(notification.id)
    }
  }

  // 📊 Obtener contador para cada filtro
  const getFilterCount = (filter: keyof NotificationFilter): number => {
    switch (filter) {
      case 'unread': return unreadCount
      case 'messages': return stats.byType.message || 0
      case 'bookings': return stats.byType.booking || 0
      case 'trips': return (stats.byType.trip || 0) + (stats.byType.confirmation || 0)
      case 'all': return stats.total
      default: return 0
    }
  }

  // 🎨 Formatear fecha de forma amigable
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return `Hoy ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 2) {
      return `Ayer ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`
    } else {
      return date.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <div className={styles.container}>
      <LoadingOverlay visible={loading} />
      
      {/* Header con navegación */}
      <div className={styles.profileTopSpacer}>
        <BackButton to="/perfil" />
      </div>

      {/* Header principal */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              <Bell size={32} color="#0a0a0a" />
            </div>
          </div>
          <div className={styles.userDetails}>
            <Text className={styles.userName}>Centro de Notificaciones</Text>
            <Text className={styles.userSubtitle}>
              {stats.total} notificaciones • {unreadCount} sin leer
            </Text>
          </div>
        </div>
        
        <div className={styles.actionsSection}>
          <button 
            className={styles.actionButton}
            onClick={refresh}
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
          
          {unreadCount > 0 && (
            <button 
              className={styles.actionButton}
              onClick={markAllAsRead}
              title="Marcar todas como leídas"
            >
              <Eye size={18} />
            </button>
          )}

          {hasRead && (
            <button 
              className={styles.actionButton}
              onClick={markAllAsUnread}
              title="Marcar todas como no leídas"
            >
              <EyeOff size={18} />
            </button>
          )}
          

        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersContainer}>
        {([
          { key: 'all', label: 'Todas', icon: Bell },
          { key: 'unread', label: 'Sin leer', icon: EyeOff },
          { key: 'messages', label: 'Mensajes', icon: MessageCircle },
          { key: 'bookings', label: 'Reservas', icon: Ticket },
          { key: 'trips', label: 'Viajes', icon: Car },
        ] as const).map(filter => {
          const count = getFilterCount(filter.key)
          const isActive = activeFilter === filter.key
          
          return (
            <button
              key={filter.key}
              className={`${styles.filterButton} ${isActive ? styles.filterButtonActive : ''}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              <filter.icon size={16} />
              <span>{filter.label}</span>
              {count > 0 && (
                <span className={styles.filterCount}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Lista de notificaciones */}
      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={48} color="rgba(0, 255, 157, 0.4)" />
            <Text className={styles.emptyText}>
              {activeFilter === 'all' ? 'No tienes notificaciones' : `No hay notificaciones ${activeFilter === 'unread' ? 'sin leer' : `de ${activeFilter}`}`}
            </Text>
            <Text className={styles.emptySubtext}>
              Las notificaciones importantes aparecerán aquí
            </Text>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const IconComponent = getNotificationIcon(notification.type)
            const iconColor = getNotificationColor(notification.type, notification.is_read)
            
            return (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.is_read ? styles.notificationItemUnread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div 
                  className={styles.notificationIcon}
                  style={{ backgroundColor: `${iconColor}20` }}
                >
                  <IconComponent size={20} color={iconColor} />
                </div>
                
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <Text className={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text className={styles.notificationTime}>
                      {formatDate(notification.send_date)}
                    </Text>
                  </div>
                  
                  <Text className={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  
                  <div className={styles.notificationMeta}>
                    <span className={`${styles.notificationBadge} ${styles[`badge-${notification.type}`]}`}>
                      {notification.type}
                    </span>
                    {!notification.is_read && (
                      <span className={styles.unreadDot}>•</span>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={(e) => handleToggleReadState(e, notification)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      color: notification.is_read ? 'rgba(0, 255, 157, 0.6)' : 'rgba(0, 255, 157, 0.8)',
                      transition: 'all 0.2s ease'
                    }}
                    title={notification.is_read ? 'Marcar como no leída' : 'Marcar como leída'}
                  >
                    {notification.is_read ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <ChevronRight size={16} color="rgba(0, 255, 157, 0.6)" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de detalles de notificación */}
      <Modal
        opened={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Detalles de la notificación"
        size="md"
        centered
      >
        {selectedNotification && (
          <div className={styles.notificationModal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                {React.createElement(getNotificationIcon(selectedNotification.type), {
                  size: 24,
                  color: getNotificationColor(selectedNotification.type, false)
                })}
              </div>
              <div>
                <Text fw={600}>{selectedNotification.title}</Text>
                <Text size="sm" c="dimmed">
                  {formatDate(selectedNotification.send_date)}
                </Text>
              </div>
            </div>
            
            <Text className={styles.modalMessage}>
              {selectedNotification.message}
            </Text>
            
            {/* ✨ Mostrar información adicional de forma visual y amigable */}
            {Object.keys(selectedNotification.data).length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <NotificationDataDisplay 
                  data={selectedNotification.data} 
                />
              </div>
            )}
            
            <div className={styles.modalActions}>
              {!selectedNotification.is_read ? (
                <Button
                  variant="light"
                  leftSection={<Eye size={16} />}
                  onClick={async () => {
                    await markAsRead(selectedNotification.id)
                    setSelectedNotification(null)
                  }}
                >
                  Marcar como leída
                </Button>
              ) : (
                <Button
                  variant="light"
                  leftSection={<EyeOff size={16} />}
                  onClick={async () => {
                    await markAsUnread(selectedNotification.id)
                    setSelectedNotification(null)
                  }}
                >
                  Marcar como no leída
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>



    </div>
  )
}

export const Route = createFileRoute('/Notifications/')({
  component: NotificationsCenter,
})

export default NotificationsCenter
