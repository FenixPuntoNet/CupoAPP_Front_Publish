import type React from 'react'
import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Container,
  Text,
  LoadingOverlay,
  Modal,
  Button,
} from '@mantine/core'
import {
  User,
  Ticket,
  HelpCircle,
  Car,
  LogOut,
  ChevronRight,
  CheckCircle,
  FileText,
  Shield,
  AlertCircle,
  Wallet,
  MessageCircle,
  Gift,
  Trash2,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import styles from './index.module.css'
import { useBackendAuth } from '@/context/BackendAuthContext'
import { Rating } from '@mantine/core'
import { DeactivateAccountModal } from '@/components/DeactivateAccountModal'
import { getCurrentUserProfile } from '@/services/profile'
import { 
  getUserVehicles, 
  getDriverLicense, 
  getPropertyCard, 
  getSoat,
  getDocumentsStatus 
} from '@/services/vehicles'

// Interfaces
interface UserProfile {
  id: number | string;
  user_id: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  identification_type?: string;
  identification_number?: string | null;
  status?: string;
  user_type?: string;
  Verification?: string | null;
  verification?: string;
  photo_user?: string;
  profile_picture?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

interface VehicleStatus {
  hasVehicle: boolean
  hasLicense: boolean
  hasSoat: boolean
  hasPropertyCard: boolean
}

interface DocumentStatus {
  type: string
  title: string
  icon: React.ComponentType<LucideProps>
  status: 'pending' | 'complete' | 'required'
  path: string
  description?: string
}

interface MenuItem {
  id: string
  icon: React.ComponentType<LucideProps>
  title: string
  subtitle: string
  path?: string
  expandable?: boolean
  subMenuItems?: SubMenuItem[]
}

interface SubMenuItem {
  id: string;
  title: string;
  path?: string;
  onClick?: () => void;
}

const ProfileView: React.FC = () => {
  const navigate = useNavigate()
  const { signOut, user } = useBackendAuth()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>({
    hasVehicle: false,
    hasLicense: false,
    hasSoat: false,
    hasPropertyCard: false,
  })
  const [error, setError] = useState('')
  const [showVehicleOptions, setShowVehicleOptions] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [showVehicleMessage, setShowVehicleMessage] = useState(false)
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // Nuevo: Botón de actualizar perfil
  const handleUpdateProfile = () => {
    navigate({ to: '/CompletarRegistro' })
  }

  // Nuevo orden y cambios en el menú
  const menuItems: MenuItem[] = [
    {
      id: 'Acount',
      icon: User,
      title: 'Cuenta',
      subtitle: 'Wallet, UniCoins, Puntos y Rachas',
      path: '/account',
    },
    {
      id: 'vehicle',
      icon: Car,
      title: 'Mi vehículo',
      subtitle: 'Gestiona la información de tu vehículo',
      expandable: true,
    },
    {
      id: 'wallet',
      icon: Wallet,
      title: 'Saldo',
      subtitle: 'Gestiona los saldos de tu billetera real para Viajar',
      expandable: true,
      subMenuItems: [
        {
          id: 'wallet-detail',
          title: 'Ver detalle de billetera',
          path: '/Wallet',
        },
        {
          id: 'wallet-reload',
          title: 'Recargar billetera',
          onClick: () => {
            window.location.href = 'https://www.cupo.dev/login';
          },
        },
      ],
    },
    {
      id: 'coupons',
      icon: Ticket,
      title: 'Codigos',
      subtitle: 'Codigos de descuento, cupones  y referidos',
      path: '/Cupones',
    },
    {
      id: 'change',
      icon: Gift, 
      title: 'Compras',
      subtitle: 'Tienda de UniCoins - Productos y servicios',
      path: '/change', 
    },
    {
      id: 'support',
      icon: HelpCircle,
      title: 'Ayuda y soporte',
      subtitle: 'Centro de ayuda y contacto',
      path: '/Ayuda',
    },
    {
      id: 'chats',
      icon: MessageCircle,
      title: 'Chats',
      subtitle: 'Salas de Comunicación',
      path: '/Chat',
    }
  ]

  // Función para actualizar el estado del usuario (comentada hasta implementar en backend)
  /*
  const checkAndUpdateUserRole = async (userId: string, hasAllDocs: boolean) => {
    try {
      // TODO: Implementar cuando esté disponible en el backend
      console.log('Update user role functionality pending backend implementation');
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };
  */

  useEffect(() => {
    const fetchAverageRating = async () => {
      if (!userProfile?.id) return;
  
      // TODO: Implementar calificaciones cuando esté disponible en el backend
      /*
      const response = await getUserRatings(userProfile.user_id);
      if (response.success && response.data) {
        const data = response.data;
        if (data.length > 0) {
          const total = data.reduce((sum: number, r: any) => sum + r.value, 0);
          const average = total / data.length;
          setAverageRating(Number(average.toFixed(1)));
        } else {
          setAverageRating(null);
        }
      }
      */
      
      // Por ahora, establecer null hasta implementar en backend
      setAverageRating(null);
    };
  
    fetchAverageRating();
  }, [userProfile]);
  

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Usar el backend service para obtener el perfil
        const profileResponse = await getCurrentUserProfile();
        
        if (!profileResponse.success || !profileResponse.data) {
          navigate({ to: '/Login' });
          return;
        }

        const profile = profileResponse.data;
        
        // Obtener información de vehículos usando el backend service
        const vehicleResponse = await getUserVehicles();
        const hasVehicle = vehicleResponse.success && vehicleResponse.hasVehicle;

        // Verificar documentos usando los servicios del backend
        let hasLicense = false;
        let hasSoat = false;
        let hasPropertyCard = false;

        if (hasVehicle) {
          // Usar el endpoint optimizado que obtiene todos los documentos
          try {
            const documentsResponse = await getDocumentsStatus();
            if (documentsResponse.success && documentsResponse.documentsStatus) {
              hasLicense = documentsResponse.documentsStatus.license.complete;
              hasSoat = documentsResponse.documentsStatus.insurance.complete;
              hasPropertyCard = documentsResponse.documentsStatus.property.complete;
              console.log('📋 Documents status:', {
                hasLicense,
                hasSoat,
                hasPropertyCard
              });
            }
          } catch (documentsError) {
            console.warn('⚠️ Error fetching documents status, falling back to individual checks');
            
            // Fallback: verificar documentos individualmente
            const [licenseResponse, soatResponse, propertyResponse] = await Promise.all([
              getDriverLicense().catch(() => ({ success: false, hasLicense: false })),
              getSoat().catch(() => ({ success: false, hasSoat: false })),
              getPropertyCard().catch(() => ({ success: false, hasPropertyCard: false }))
            ]);

            hasLicense = licenseResponse.success && licenseResponse.hasLicense;
            hasSoat = soatResponse.success && soatResponse.hasSoat;
            hasPropertyCard = propertyResponse.success && propertyResponse.hasPropertyCard;
            
            console.log('📋 Individual document checks:', {
              hasLicense,
              hasSoat,
              hasPropertyCard
            });
          }
        }

        if (profile) {
          // Use the user data from auth context instead of calling getUser()
          console.log('🔍 User from auth context:', user);
          
          setUserProfile({
            id: Number(profile.id),
            user_id: profile.user_id,
            phone_number: profile.phone_number || '',
            // Prefer profile data first, then fallback to user context
            first_name: profile.first_name || (user ? user.username : 'Usuario'),
            last_name: profile.last_name || '',
            identification_type: profile.identification_type || 'CC',
            identification_number: profile.identification_number || null,
            status: profile.status || 'ACTIVE',
            user_type: profile.status || 'PASSENGER',
            Verification: profile.verification || 'SIN VERIFICAR',
            photo_user: profile.profile_picture || '', 
          });
          
          // Set email from auth context - this ensures we display the email, not UUID
          if (user && user.email) {
            setUserEmail(user.email);
            console.log('Using email from auth context:', user.email);
          } else {
            setUserEmail('usuario@example.com');
            console.log('No email found in auth context, using default');
          }
        }

        setVehicleStatus({
          hasVehicle: Boolean(hasVehicle),
          hasLicense: hasLicense,
          hasSoat: hasSoat,
          hasPropertyCard: hasPropertyCard
        });

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar la información');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate, user]);

  const renderUserSection = () => (
    <div className={styles.userSection}>
      <div className={styles.userAvatar}>
        {userProfile?.photo_user ? (
          <img
            src={userProfile.photo_user}
            alt="Foto de perfil"
            className={styles.userPhoto}
          />
        ) : (
          <User size={40} />
        )}
      </div>
      <div className={styles.userInfo}>
        <Text className={styles.userName}>
          {userProfile?.first_name ? 
            `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : 
            user?.username || 'Usuario'
          }
        </Text>
        <Text className={styles.userEmail}>{userEmail}</Text>
        <div
          className={`${styles.userType} ${
            userProfile?.user_type === 'DRIVER' ? styles.driver : ''
          }`}
        >
          <Text>
            {userProfile?.user_type === 'DRIVER' ? (
              <>Conductor</>
            ) : (
              'Pasajero'
            )}
          </Text>
          {userProfile?.user_type === 'DRIVER' && (
            <div className={styles.driverRating}>
              {averageRating !== null ? (
                <Rating value={averageRating} readOnly size="sm" />
              ) : (
                <Text c="gray" size="xs"></Text>
              )}
            </div>
          )}
        </div>
      </div>
      <Button
        className={styles.updateProfileBtn}
        variant="outline"
        size="xs"
        onClick={handleUpdateProfile}
      >
        Actualizar perfil
      </Button>
    </div>
  );

  useEffect(() => {
    const checkDocumentCompletion = async () => {
      if (userProfile) {
        const allDocumentsComplete =
          vehicleStatus.hasVehicle &&
          vehicleStatus.hasLicense &&
          vehicleStatus.hasSoat &&
          vehicleStatus.hasPropertyCard;

        if (userProfile.user_type === 'PASSENGER' && allDocumentsComplete) {
          try {
            setLoading(true);
            // TODO: Implementar actualización de estado a conductor cuando esté disponible en el backend
            /*
            const updateResponse = await updateUserToDriver();
            if (updateResponse.success) {
              setUserProfile(prev => ({
                ...(prev as UserProfile),
                user_type: 'DRIVER'
              }));

              setSuccessMessage(
                `¡Felicitaciones ${userProfile.first_name}! Ya eres conductor en Cupo. Ahora puedes publicar viajes.`
              );
              setIsSuccessModalOpen(true);
            } else {
              throw new Error('Error updating user role');
            }
            */
            
            // Por ahora, solo mostrar mensaje sin actualizar en BD
            console.log('User role update pending backend implementation');

          } catch (error) {
            console.error('Error al actualizar el rol:', error);
            setError('Error al actualizar tu perfil de conductor');
          } finally {
            setLoading(false);
          }
        } else if (!allDocumentsComplete && userProfile.user_type === 'PASSENGER') {
          setShowVehicleMessage(true);
        }
      }
    };

    checkDocumentCompletion();
  }, [vehicleStatus, userProfile]);

  const handleLogout = async () => {
    try {
      await signOut();
      // El AuthGuard se encargará de la navegación
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleNavigation = (path: string) => {
    navigate({ to: path });
  };

  const toggleVehicleOptions = () => {
    setShowVehicleOptions(!showVehicleOptions)
  }

  const toggleWalletOptions = () => {
    setShowWalletOptions(!showWalletOptions)
  }

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false)
  }

  const getDocumentsList = (): DocumentStatus[] => {
    return [
      {
        type: 'vehicle',
        title: 'Registro de Vehículo',
        icon: Car,
        status: vehicleStatus.hasVehicle ? 'complete' : 'required',
        path: '/RegistrarVehiculo',
        description: 'Información básica del vehículo',
      },
      {
        type: 'license',
        title: 'Licencia de Conducción',
        icon: FileText,
        status: vehicleStatus.hasLicense ? 'complete' : 'required',
        path: '/RegistrarVehiculo/License',
        description: 'Documento de conducción vigente',
      },
      {
        type: 'soat',
        title: 'SOAT',
        icon: Shield,
        status: vehicleStatus.hasSoat ? 'complete' : 'required',
        path: '/RegistrarVehiculo/Soat',
        description: 'Seguro obligatorio vigente',
      },
      {
        type: 'property',
        title: 'Tarjeta de Propiedad',
        icon: FileText,
        status: vehicleStatus.hasPropertyCard ? 'complete' : 'required',
        path: '/RegistrarVehiculo/PropertyCard',
        description: 'Documento de propiedad del vehículo',
      },
    ]
  }

  const renderVehicleSubmenu = () => (
    <div className={styles.subMenu}>
      {getDocumentsList().map((doc) => (
        <div
          key={doc.type}
          className={`${styles.subMenuItem} ${
            doc.status === 'complete' ? styles.completed : ''
          }`}
          onClick={() => handleNavigation(doc.path)}
        >
          <div className={styles.subMenuItemContent}>
            <div className={styles.subMenuItemIcon}>
              <doc.icon size={24} />
            </div>
            <div className={styles.subMenuItemDetails}>
              <Text className={styles.subMenuItemText}>{doc.title}</Text>
              {doc.description && (
                <Text className={styles.subMenuItemDescription}>
                  {doc.description}
                </Text>
              )}
            </div>
          </div>
          <div className={styles.subMenuItemStatus}>
            {doc.status === 'complete' ? (
              <CheckCircle size={16} className={styles.statusIconComplete} />
            ) : (
              <AlertCircle size={16} className={styles.statusIconRequired} />
            )}
            <Text className={styles.statusText}>
              {doc.status === 'complete' ? 'Completado' : 'Requerido'}
            </Text>
          </div>
        </div>
      ))}
      {showVehicleMessage && userProfile?.user_type === 'PASSENGER' && (
        <div className={styles.vehicleIncompleteMessage}>
          <Text className={styles.vehicleIncompleteText}>
            Para convertirte en conductor, completa todos los documentos requeridos
          </Text>
        </div>
      )}
      {userProfile?.user_type === 'DRIVER' && (
        <div className={styles.vehicleRegistrationComplete}>
          {userProfile.Verification === 'VERIFICADO' ? (
            <>
              <Text className={styles.vehicleRegistrationText}>
                ¡Eres conductor verificado!
              </Text>
              <Text className={styles.vehicleRegistrationSubtitle}>
                Puedes publicar y gestionar viajes
              </Text>
            </>
          ) : (
            <div className={styles.verificationPendingBox}>
              <Text className={styles.verificationPendingText}>
                En proceso de verificación
              </Text>
              <Text className={styles.verificationPendingSubtitle}>
                Aún no puedes publicar viajes
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderWalletSubmenu = (subMenuItems: SubMenuItem[]) => {
    return (
      <div className={styles.subMenu}>
        {subMenuItems.map((subItem) => (
          <div
            key={subItem.id}
            className={styles.subMenuItem}
            onClick={() => {
              if (subItem.onClick) {
                subItem.onClick();
              } else if (subItem.path) {
                handleNavigation(subItem.path);
              }
            }}
          >
            <div className={styles.subMenuItemContent}>
              <div className={styles.subMenuItemDetails}>
                <Text className={styles.subMenuItemText}>{subItem.title}</Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Container fluid className={styles.container}>
        <LoadingOverlay visible />
      </Container>
    )
  }

  return (
    <Container fluid className={styles.container}>
      <Modal
        opened={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        title="Éxito"
        classNames={{
          root: styles.modalContainer,
          title: styles.modalTitle,
          body: styles.modalBody,
          header: styles.modalHeader,
          close: styles.modalCloseButton,
        }}
      >
        <div className={styles.modalContent}>
          <CheckCircle size={60} color="green" className={styles.modalIcon} />
          <Text size="xl" fw={500} mt="md" className={styles.modalParagraph}>
            ¡Felicitaciones! Ya eres conductor en Cupo. Ahora puedes publicar viajes.
          </Text>
          <Button
            onClick={handleSuccessModalClose}
            variant="filled"
            color="green"
            className={styles.buttonModalPrimary}
          >
            Aceptar
          </Button>
        </div>
      </Modal>

      {/* Espaciado superior extra para que el perfil no quede pegado arriba */}
      <div className={styles.profileTopSpacer} />

      {renderUserSection()}

      <div className={styles.menuSection}>
        {menuItems.map((item) => (
          <div key={item.id}>
            <div
              className={`${styles.menuItem} ${
                item.expandable &&
                  ((item.id === 'vehicle' && showVehicleOptions) ||
                    (item.id === 'wallet' && showWalletOptions))
                  ? styles.expanded
                  : ''
              }`}
              onClick={() => {
                if (item.expandable) {
                  if (item.id === 'vehicle') {
                    toggleVehicleOptions()
                  } else if (item.id === 'wallet') {
                    toggleWalletOptions();
                  }
                } else if (item.path) {
                  handleNavigation(item.path)
                }
              }}
              data-type={item.id}
            >
              <div className={styles.menuItemIcon}>
                <item.icon size={24} />
              </div>
              <div className={styles.menuItemContent}>
                <Text className={styles.menuItemTitle}>{item.title}</Text>
                <Text className={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </div>
              <ChevronRight
                className={`${styles.menuItemArrow} ${
                  item.expandable &&
                    ((item.id === 'vehicle' && showVehicleOptions) ||
                      (item.id === 'wallet' && showWalletOptions))
                    ? styles.rotatedArrow
                    : ''
                }`}
                size={20}
              />
            </div>
            {item.expandable && item.id === 'vehicle' && showVehicleOptions && renderVehicleSubmenu()}
            {item.expandable && item.id === 'wallet' && showWalletOptions &&
             item.subMenuItems && renderWalletSubmenu(item.subMenuItems)}
          </div>
        ))}

        {/* Botón de eliminar cuenta */}
        <button
          className={`${styles.menuItem} ${styles.deleteAccountButton}`}
          onClick={() => setShowDeleteAccountModal(true)}
        >
          <div className={styles.menuItemIcon}>
            <Trash2 size={24} />
          </div>
          <div className={styles.menuItemContent}>
            <Text className={styles.menuItemTitle}>Eliminar cuenta</Text>
            <Text className={styles.menuItemSubtitle}>Eliminar permanentemente mi cuenta</Text>
          </div>
          <ChevronRight className={styles.menuItemArrow} size={20} />
        </button>

        <button
          className={`${styles.menuItem} ${styles.logoutButton}`}
          onClick={handleLogout}
        >
          <div className={styles.menuItemIcon}>
            <LogOut size={24} />
          </div>
          <div className={styles.menuItemContent}>
            <Text className={styles.menuItemTitle}>Salir</Text>
            <Text className={styles.menuItemSubtitle}>Cerrar sesión</Text>
          </div>
          <ChevronRight className={styles.menuItemArrow} size={20} />
        </button>
      </div>

      {error && (
        <Text className={styles.errorMessage}>
          <AlertCircle size={16} style={{ marginRight: 8 }} />
          {error}
        </Text>
      )}

      <Text className={styles.version}>v3.00.0 (968)</Text>

      {/* Modal de eliminación de cuenta */}
      <DeactivateAccountModal
        opened={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />
    </Container>
  )
}

export const Route = createFileRoute('/Perfil/')({
  component: ProfileView,
})

export default ProfileView