import { useState, useEffect, useCallback } from 'react';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import {
    Container,
    Title,
    Button,
    Text,
    UnstyledButton,
    LoadingOverlay,
    Alert,
    Modal,
    Stack,
    TextInput,
    Textarea,
    Select,
    Group
} from '@mantine/core';
import { 
    ArrowLeft, 
    Shield, 
    Plus, 
    AlertCircle,
    Train,
    Building2,
    GraduationCap,
    Cross,
    Landmark
} from 'lucide-react';
import { GoogleMap } from '@react-google-maps/api';
import { notifications } from '@mantine/notifications';
import {
    tripStore,
    type TripStopover,
    type StopData,
    type TripData
} from '../../types/PublicarViaje/TripDataManagement';
import {
    searchNearbySafePoints,
    getSafePointsByCategory,
    type SafePoint,
    type SafePointCategory,
    type SafePointProposalRequest
} from '../../services/safepoints';
import {
    addSafePointToDraft
} from '../../services/trip-drafts';
import { useTripDraft } from '../../hooks/useTripDraft';
import SafePointMarker from '../../components/SafePoints/SafePointMarker';
import styles from './index.module.css';

// Tipo para categorías principales disponibles
type MainSafePointCategory = 'metro_station' | 'mall' | 'university' | 'hospital' | 'bank';

// Configuración de categorías principales disponibles
const categoryConfig: Record<MainSafePointCategory, {
    icon: React.ComponentType<any>;
    name: string;
    description: string;
    color: string;
}> = {
    metro_station: { 
        icon: Train, 
        name: 'Metro', 
        description: 'Estaciones de transporte',
        color: '#3b82f6'
    },
    mall: { 
        icon: Building2, 
        name: 'Centros Comerciales', 
        description: 'Lugares de compras',
        color: '#a855f7'
    },
    university: { 
        icon: GraduationCap, 
        name: 'Universidades', 
        description: 'Centros educativos',
        color: '#f97316'
    },
    hospital: { 
        icon: Cross, 
        name: 'Hospitales', 
        description: 'Centros médicos',
        color: '#ef4444'
    },
    bank: { 
        icon: Landmark, 
        name: 'Bancos', 
        description: 'Entidades financieras',
        color: '#22c55e'
    }
};

function SafePointsView() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Hook para manejar borradores
    const { 
        draft, 
        createOrUpdateTripDraft
    } = useTripDraft();
    
    // Estados para el journey mejorado
    const [currentStep, setCurrentStep] = useState<'origin' | 'destination'>('origin');
    const [originSafePoints, setOriginSafePoints] = useState<Set<number>>(new Set());
    const [destinationSafePoints, setDestinationSafePoints] = useState<Set<number>>(new Set());
    
    // Estados para SafePoints y UI
    const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<SafePointCategory | null>(null);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [allowPassengerSafePoints, setAllowPassengerSafePoints] = useState<boolean>(true);
    const [showMap, setShowMap] = useState(false);
    const [proposalData, setProposalData] = useState<SafePointProposalRequest>({
        name: '',
        description: '',
        category: 'user_proposed' as SafePointCategory,
        latitude: 0,
        longitude: 0,
        address: '',
        city: '',
        reason: ''
    });

    // Generar trip_id temporal para interacciones
    // Función para generar trip_id numérico
    // const getTripId = () => {
    //     const tripData = tripStore.getStoredData();
        
    //     if (tripData?.id && typeof tripData.id === 'number') {
    //         return tripData.id;
    //     }
        
    //     return Math.floor(Date.now() / 1000);
    // };

    // Cargar SafePoints a lo largo de la ruta (no solo origen/destino)
    const loadNearbySafePoints = useCallback(async () => {
        try {
            const origin = tripStore.getOrigin();
            const destination = tripStore.getDestination();

            if (!origin || !destination) {
                throw new Error('No se encontraron origen y destino');
            }

            console.log('🔍 Cargando SafePoints a lo largo de la ruta...');

            // Calcular puntos intermedios a lo largo de la ruta
            const routePoints = [
                { lat: origin.coords.lat, lng: origin.coords.lng, type: 'origin' },
                // Punto medio de la ruta
                { 
                    lat: (origin.coords.lat + destination.coords.lat) / 2, 
                    lng: (origin.coords.lng + destination.coords.lng) / 2,
                    type: 'midway'
                },
                { lat: destination.coords.lat, lng: destination.coords.lng, type: 'destination' }
            ];

            // Buscar SafePoints cerca de cada punto de la ruta
            const routeSafePointsPromises = routePoints.map(point =>
                searchNearbySafePoints({
                    latitude: point.lat,
                    longitude: point.lng,
                    radius_km: 3, // Radio menor para SafePoints más relevantes
                    limit: 12
                })
            );

            const routeResults = await Promise.all(routeSafePointsPromises);

            // Combinar y eliminar duplicados
            const allSafePointsMap = new Map<number, SafePoint>();
            
            routeResults.forEach((result, index) => {
                if (result.success && result.safepoints) {
                    result.safepoints.forEach((sp: SafePoint) => {
                        if (!allSafePointsMap.has(sp.id)) {
                            // Marcar relevancia del SafePoint en la ruta
                            const enhancedSafePoint = {
                                ...sp, 
                                distance_km: sp.distance_km || 0,
                                route_relevance: routePoints[index].type
                            };
                            allSafePointsMap.set(sp.id, enhancedSafePoint);
                        }
                    });
                }
            });

            // Ordenar por relevancia: verificados primero, luego por distancia
            const uniqueSafePoints = Array.from(allSafePointsMap.values())
                .sort((a, b) => {
                    // Priorizar SafePoints verificados
                    if (a.is_verified && !b.is_verified) return -1;
                    if (!a.is_verified && b.is_verified) return 1;
                    // Luego por distancia
                    return (a.distance_km || 0) - (b.distance_km || 0);
                })
                .slice(0, 25); // Limitar para mejor performance
            
            setSafePoints(uniqueSafePoints);
            console.log('✅ SafePoints de la ruta cargados:', uniqueSafePoints.length);

        } catch (error) {
            console.error('❌ Error cargando SafePoints de la ruta:', error);
            setSafePoints([]);
            setError('Error cargando SafePoints: ' + (error instanceof Error ? error.message : 'Error de conexión'));
        }
    }, []);

    // Cargar SafePoints por categoría
    const loadSafePointsByCategory = useCallback(async (category: SafePointCategory) => {
        try {
            setIsLoading(true);
            console.log('🔍 Cargando SafePoints de categoría:', category);
            
            const result = await getSafePointsByCategory(category, undefined, 50, true);
            
            if (result.success) {
                setSafePoints(result.safepoints);
                console.log('✅ SafePoints de categoría cargados:', result.safepoints.length);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ Error cargando categoría:', error);
            setError('Error cargando categoría: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Manejar selección de categoría
    const handleCategorySelect = useCallback((category: SafePointCategory | null) => {
        setSelectedCategory(category);
        if (category) {
            loadSafePointsByCategory(category);
        } else {
            setIsLoading(true);
            loadNearbySafePoints().finally(() => setIsLoading(false));
        }
    }, [loadSafePointsByCategory, loadNearbySafePoints]);

    // Manejar selección de SafePoint según el paso actual
    const handleSafePointSelect = useCallback(async (safePoint: SafePoint) => {
        try {
            // Asegurar que tenemos un borrador antes de seleccionar SafePoints
            const origin = tripStore.getOrigin();
            const destination = tripStore.getDestination();
            
            if (!origin || !destination) {
                setError('Debes tener origen y destino configurados');
                return;
            }

            // Crear/actualizar borrador si no existe
            if (!draft) {
                await createOrUpdateTripDraft(origin, destination);
            }

            // Actualizar estado local
            if (currentStep === 'origin') {
                const newSelected = new Set(originSafePoints);
                if (newSelected.has(safePoint.id)) {
                    newSelected.delete(safePoint.id);
                } else {
                    newSelected.add(safePoint.id);
                    
                    // Agregar al borrador - SOLO BACKEND, no recargar localStorage
                    const result = await addSafePointToDraft({
                        safepoint_id: safePoint.id,
                        selection_type: 'pickup_selection',
                        route_order: newSelected.size
                    });
                    
                    if (!result.success) {
                        console.error('Error adding SafePoint to draft:', result.error);
                        notifications.show({
                            title: 'Error',
                            message: 'No se pudo guardar la selección',
                            color: 'red'
                        });
                        return;
                    }
                }
                setOriginSafePoints(newSelected);
            } else {
                const newSelected = new Set(destinationSafePoints);
                if (newSelected.has(safePoint.id)) {
                    newSelected.delete(safePoint.id);
                } else {
                    newSelected.add(safePoint.id);
                    
                    // Agregar al borrador - SOLO BACKEND, no recargar localStorage
                    const result = await addSafePointToDraft({
                        safepoint_id: safePoint.id,
                        selection_type: 'dropoff_selection',
                        route_order: newSelected.size
                    });
                    
                    if (!result.success) {
                        console.error('Error adding SafePoint to draft:', result.error);
                        notifications.show({
                            title: 'Error',
                            message: 'No se pudo guardar la selección',
                            color: 'red'
                        });
                        return;
                    }
                }
                setDestinationSafePoints(newSelected);
            }
            
            // ✅ CORREGIDO: NO recargar datos del borrador aquí - evita el "refresh extraño"
            // El estado local ya está actualizado arriba
            
            // Registrar interacción localmente
            console.log('🔄 SafePoint seleccionado exitosamente:', {
                step: currentStep,
                safepoint_id: safePoint.id,
                timestamp: new Date().toISOString(),
                backend_saved: true
            });
            
        } catch (error) {
            console.error('❌ Error selecting SafePoint:', error);
            setError('Error seleccionando SafePoint: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        }
    }, [currentStep, originSafePoints, destinationSafePoints, draft, createOrUpdateTripDraft]);

    // Obtener icono de categoría
    // Función para obtener icono de categoría
    // const getCategoryIcon = (category: SafePointCategory) => {
    //     if (category === 'user_proposed') return MapPin;
    //     return categoryConfig[category as keyof typeof categoryConfig]?.icon || MapPin;
    // };

    // Obtener emoji de categoría para SafePoints
    const getCategoryEmoji = useCallback((category: SafePointCategory): string => {
        const emojiMap: Record<SafePointCategory, string> = {
            metro_station: '🚇',
            mall: '🏬',
            university: '🎓',
            hospital: '🏥',
            bank: '🏦',
            park: '🌳',
            government: '🏛️',
            church: '⛪',
            hotel: '🏨',
            restaurant: '🍽️',
            gas_station: '⛽',
            supermarket: '🛒',
            user_proposed: '📍'
        };
        return emojiMap[category] || '📍';
    }, []);

    // Formatear distancia
    const formatDistance = useCallback((distance?: number): string => {
        if (!distance) return '';
        if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
        return `${distance.toFixed(1)}km`;
    }, []);

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Cargar SafePoints de la ruta
                await loadNearbySafePoints();
                
                // Cargar datos del borrador si existen
                if (draft?.draft_safepoint_selections) {
                    const originSelections = new Set<number>();
                    const destinationSelections = new Set<number>();
                    
                    draft.draft_safepoint_selections.forEach((selection: any) => {
                        if (selection.selection_type === 'pickup_selection') {
                            originSelections.add(selection.safepoint_id);
                        } else if (selection.selection_type === 'dropoff_selection') {
                            destinationSelections.add(selection.safepoint_id);
                        }
                    });
                    
                    setOriginSafePoints(originSelections);
                    setDestinationSafePoints(destinationSelections);
                    
                    console.log('✅ Loaded SafePoint selections from draft:', {
                        origin: originSelections.size,
                        destination: destinationSelections.size
                    });
                }
                
            } catch (err) {
                console.error('Error cargando datos iniciales:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [loadNearbySafePoints, draft]);

    // Confirmar selección del paso actual
    const handleConfirm = async () => {
        if (currentStep === 'origin') {
            if (originSafePoints.size === 0) {
                setError('Debes seleccionar al menos un SafePoint de origen');
                return;
            }
            
            // Crear/actualizar borrador con los datos actuales
            const origin = tripStore.getOrigin();
            const destination = tripStore.getDestination();
            
            if (!origin || !destination) {
                setError('Debes tener origen y destino configurados');
                return;
            }
            
            try {
                if (!draft) {
                    await createOrUpdateTripDraft(origin, destination);
                }
                
                // Cambiar al paso de destino
                setCurrentStep('destination');
                setSelectedCategory(null);
                loadNearbySafePoints(); // Cargar SafePoints cerca del destino
                return;
            } catch (error) {
                console.error('Error updating draft:', error);
                setError('Error actualizando borrador');
                return;
            }
        }

        // Confirmar destino y completar el proceso
        try {
            setIsLoading(true);

            // Los datos ya están guardados en el borrador, solo necesitamos navegar
            console.log('✅ SafePoints confirmados, navegando a paradas...');
            
            // La migración automática ocurrirá cuando se publique el viaje
            // Por ahora, guardamos los datos en el tripStore para compatibilidad
            const allSelectedSafePoints = new Set([...originSafePoints, ...destinationSafePoints]);
            
            // Convertir SafePoints seleccionados a TripStopovers para el store local
            const safePointStopovers: TripStopover[] = [];
            
            for (const safePointId of allSelectedSafePoints) {
                const safePoint = safePoints.find(sp => sp.id === safePointId);
                if (safePoint) {
                    const stopData: StopData = {
                        location_id: safePoint.id,
                        placeId: safePoint.place_id || `safepoint_${safePoint.id}`,
                        address: safePoint.address,
                        coords: {
                            lat: safePoint.latitude,
                            lng: safePoint.longitude
                        },
                        mainText: safePoint.name,
                        secondaryText: safePoint.description || ''
                    };
                    
                    safePointStopovers.push({
                        location: stopData,
                        order: safePointStopovers.length + 1,
                        estimatedTime: ''
                    });
                }
            }

            // Guardar en el store local para compatibilidad
            const updateData: Partial<TripData> = {
                stopovers: safePointStopovers,
                allowPassengerSafePoints
            };

            if (allSelectedSafePoints.size > 0) {
                updateData.selectedSafePointIds = Array.from(allSelectedSafePoints);
            }

            tripStore.updateData(updateData);
            
            console.log('✅ SafePoints confirmados:', {
                origin: Array.from(originSafePoints),
                destination: Array.from(destinationSafePoints),
                total: safePointStopovers.length,
                draftExists: !!draft
            });

            // Navegar a paradas
            navigate({ to: '/Paradas' });

        } catch (err) {
            console.error('Error confirmando SafePoints:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <Container fluid className={styles.container}>
            <LoadingOverlay visible={isLoading} />

            {/* Header Moderno */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <UnstyledButton 
                        onClick={() => navigate({ to: '/publicarviaje' })} 
                        className={styles.backButton}
                    >
                        <ArrowLeft size={20} />
                    </UnstyledButton>
                    <div>
                        <Title className={styles.headerTitle}>
                            {currentStep === 'origin' ? 'SafePoints de Origen' : 'SafePoints de Destino'}
                        </Title>
                        <div className={styles.headerSubtitle}>
                            {currentStep === 'origin' 
                                ? 'Selecciona dónde pueden recogerte' 
                                : 'Selecciona dónde pueden dejarte'
                            }
                        </div>
                    </div>
                </div>
                
                {/* Botón Volver elegante para paso de destino */}
                {currentStep === 'destination' && (
                    <div style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1))',
                        borderRadius: '15px',
                        padding: '2px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => {
                                setCurrentStep('origin');
                                setSelectedCategory(null);
                                loadNearbySafePoints();
                            }}
                            leftSection={<ArrowLeft size={16} />}
                            style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#3b82f6',
                                border: 'none',
                                borderRadius: '13px',
                                fontWeight: '600',
                                fontSize: '14px',
                                height: '36px',
                                paddingLeft: '12px',
                                paddingRight: '16px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Volver a Origen
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <Alert
                    icon={<AlertCircle size={16} />}
                    title="Error"
                    color="red"
                    className={styles.errorAlert}
                >
                    {error}
                </Alert>
            )}

            {/* Menú de Categorías Revolucionario */}
            <div className={styles.categoryMenuContainer}>
                <div className={styles.categoryMenuHeader}>
                    <Text className={styles.categoryMenuTitle}>Categorías</Text>
                    <Button
                        size="xs"
                        variant="light"
                        leftSection={<Plus size={14} />}
                        onClick={() => setShowProposalModal(true)}
                        style={{ 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa'
                        }}
                    >
                        Proponer
                    </Button>
                </div>

                <div className={styles.categoryGrid}>
                    {/* Categoría "Cercanos" (por defecto) */}
                    <div 
                        className={`${styles.categoryCard} ${!selectedCategory ? styles.active : ''}`}
                        onClick={() => handleCategorySelect(null)}
                    >
                        <div className={styles.categoryIcon}>📍</div>
                        <Text className={styles.categoryName}>En la Ruta</Text>
                        <Text className={styles.categoryCount}>
                            {!selectedCategory ? safePoints.length : 0} disponibles
                        </Text>
                    </div>

                    {/* Categorías dinámicas */}
                    {Object.entries(categoryConfig).map(([key, config]) => {
                        const IconComponent = config.icon;
                        const isSelected = selectedCategory === key;
                        
                        return (
                            <div 
                                key={key}
                                className={`${styles.categoryCard} ${isSelected ? styles.active : ''}`}
                                onClick={() => handleCategorySelect(key as SafePointCategory)}
                            >
                                <IconComponent 
                                    size={28} 
                                    className={styles.categoryIcon}
                                    color={config.color}
                                />
                                <Text className={styles.categoryName}>{config.name}</Text>
                                <Text className={styles.categoryCount}>
                                    {isSelected ? safePoints.length : '...'} disponibles
                                </Text>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toggle para Paradas de Pasajeros */}
            <div className={styles.passengerToggleContainer}>
                <div className={styles.passengerToggleHeader}>
                    <div>
                        <Text className={styles.passengerToggleTitle}>
                            Paradas de Pasajeros
                        </Text>
                        <Text className={styles.passengerToggleDescription}>
                            {allowPassengerSafePoints 
                                ? 'Los pasajeros pueden sugerir paradas cercanas'
                                : 'Solo paradas preseleccionadas por el conductor'
                            }
                        </Text>
                    </div>
                    <div 
                        className={`${styles.toggleSwitch} ${allowPassengerSafePoints ? styles.active : ''}`}
                        onClick={() => setAllowPassengerSafePoints(!allowPassengerSafePoints)}
                    />
                </div>
            </div>

            {/* Sección de SafePoints */}
            <div className={styles.nearbySection}>
                <div className={styles.sectionHeader}>
                    <Text className={styles.sectionTitle}>
                        {selectedCategory 
                            ? (selectedCategory === 'user_proposed' ? 'Categoría' : categoryConfig[selectedCategory as keyof typeof categoryConfig]?.name || 'Categoría')
                            : 'SafePoints en la Ruta'
                        }
                    </Text>
                    {!showMap && (
                        <Button
                            size="xs"
                            variant="light"
                            onClick={() => setShowMap(true)}
                            className={styles.viewAllButton}
                        >
                            Ver Mapa
                        </Button>
                    )}
                </div>

                {/* Lista de SafePoints Moderna */}
                <div className={styles.safePointsList}>
                    {safePoints.length === 0 && !isLoading ? (
                        <div className={styles.emptyState}>
                            <Shield size={48} className={styles.emptyIcon} />
                            <Text className={styles.emptyTitle}>No hay SafePoints</Text>
                            <Text className={styles.emptyMessage}>
                                No se encontraron SafePoints para esta categoría. 
                                Intenta con otra categoría o propón uno nuevo.
                            </Text>
                        </div>
                    ) : (
                        safePoints.map((safePoint) => {
                            const currentSelectedPoints = currentStep === 'origin' ? originSafePoints : destinationSafePoints;
                            const isSelected = currentSelectedPoints.has(safePoint.id);
                            const categoryClass = safePoint.category.replace('_', '');
                            
                            return (
                                <div 
                                    key={safePoint.id}
                                    className={`${styles.modernSafePointCard} ${isSelected ? styles.selected : ''}`}
                                >
                                    <div className={styles.cardContent}>
                                        <div className={styles.cardHeader}>
                                            <div className={`${styles.modernCategoryIcon} ${styles[categoryClass]}`}>
                                                {getCategoryEmoji(safePoint.category)}
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <Text className={styles.cardTitle}>{safePoint.name}</Text>
                                                <Text className={styles.cardAddress}>{safePoint.address}</Text>
                                                <div className={styles.cardBadges}>
                                                    {safePoint.is_verified && (
                                                        <span className={`${styles.modernBadge} ${styles.verifiedBadge}`}>
                                                            ✓ Verificado
                                                        </span>
                                                    )}
                                                    {safePoint.distance_km && (
                                                        <span className={`${styles.modernBadge} ${styles.distanceBadge}`}>
                                                            📍 {formatDistance(safePoint.distance_km)}
                                                        </span>
                                                    )}
                                                    {safePoint.rating_average && (
                                                        <span className={`${styles.modernBadge} ${styles.ratingBadge}`}>
                                                            ⭐ {safePoint.rating_average.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`${styles.modernActionButton} ${styles.selectButton}`}
                                            onClick={() => handleSafePointSelect(safePoint)}
                                        >
                                            {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Resumen de Selección */}
            {((currentStep === 'origin' && originSafePoints.size > 0) || 
              (currentStep === 'destination' && destinationSafePoints.size > 0) ||
              (currentStep === 'destination' && originSafePoints.size > 0)) && (
                <div className={styles.selectionSummary}>
                    <div className={styles.summaryHeader}>
                        <Text className={styles.summaryTitle}>
                            {currentStep === 'origin' ? 'Origen Seleccionado' : 'Progreso'}
                        </Text>
                        <span className={styles.summaryCount}>
                            {currentStep === 'origin' 
                                ? originSafePoints.size 
                                : `${originSafePoints.size} + ${destinationSafePoints.size}`
                            }
                        </span>
                    </div>
                    <div className={styles.selectedList}>
                        {currentStep === 'origin' ? (
                            // Mostrar solo selecciones de origen
                            Array.from(originSafePoints).map(id => {
                                const safePoint = safePoints.find(sp => sp.id === id);
                                if (!safePoint) return null;
                                
                                return (
                                    <div key={id} className={styles.selectedItem}>
                                        <span className={styles.selectedItemIcon}>
                                            {getCategoryEmoji(safePoint.category)}
                                        </span>
                                        <span className={styles.selectedItemText}>
                                            {safePoint.name}
                                        </span>
                                        <button 
                                            className={styles.removeSelectedButton}
                                            onClick={() => {
                                                const newSet = new Set(originSafePoints);
                                                newSet.delete(id);
                                                setOriginSafePoints(newSet);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            // Mostrar resumen completo en paso de destino
                            <>
                                {originSafePoints.size > 0 && (
                                    <div className={styles.stepSummary}>
                                        <Text style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                                            ✓ Origen ({originSafePoints.size} seleccionados)
                                        </Text>
                                    </div>
                                )}
                                {Array.from(destinationSafePoints).map(id => {
                                    const safePoint = safePoints.find(sp => sp.id === id);
                                    if (!safePoint) return null;
                                    
                                    return (
                                        <div key={id} className={styles.selectedItem}>
                                            <span className={styles.selectedItemIcon}>
                                                {getCategoryEmoji(safePoint.category)}
                                            </span>
                                            <span className={styles.selectedItemText}>
                                                {safePoint.name} (Destino)
                                            </span>
                                            <button 
                                                className={styles.removeSelectedButton}
                                                onClick={() => {
                                                    const newSet = new Set(destinationSafePoints);
                                                    newSet.delete(id);
                                                    setDestinationSafePoints(newSet);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Mapa (mostrar cuando se solicite) */}
            {showMap && (
                <div className={styles.mapSection}>
                    <div className={styles.mapContainer}>
                        <div className={styles.mapHeader}>
                            <Text className={styles.mapTitle}>Mapa de SafePoints</Text>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setShowMap(false)}
                                style={{ 
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white'
                                }}
                            >
                                ✕
                            </Button>
                        </div>
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '250px' }}
                            center={{ lat: 3.4516, lng: -76.5320 }}
                            zoom={12}
                            options={{
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                                styles: [
                                    {
                                        featureType: "all",
                                        elementType: "geometry",
                                        stylers: [{ color: "#1a1a2e" }]
                                    },
                                    {
                                        featureType: "water",
                                        elementType: "geometry",
                                        stylers: [{ color: "#16213e" }]
                                    },
                                    {
                                        featureType: "road",
                                        elementType: "geometry",
                                        stylers: [{ color: "#2a2a3e" }]
                                    }
                                ]
                            }}
                        >
                            {safePoints.map(safePoint => (
                                <SafePointMarker
                                    key={safePoint.id}
                                    safePoint={safePoint}
                                    isSelected={
                                        (currentStep === 'origin' ? originSafePoints : destinationSafePoints).has(safePoint.id)
                                    }
                                    showInfo={false}
                                    onSelect={() => {}}
                                    onClose={() => {}}
                                    onPickupSelect={() => {}}
                                    onDropoffSelect={() => {}}
                                    mode="view"
                                />
                            ))}
                        </GoogleMap>
                    </div>
                </div>
            )}

            {/* BOTÓN ÚNICO ELEGANTE - POR ENCIMA DEL MENÚ */}
            {((currentStep === 'origin' && originSafePoints.size > 0) ||
              (currentStep === 'destination' && destinationSafePoints.size > 0)) && (
            <div 
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '15px',
                    right: '15px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: '20px',
                    padding: '10px',
                    zIndex: '999999',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer'
                }}
                onClick={handleConfirm}
            >
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#1d4ed8',
                    border: 'none',
                    height: '45px',
                    flex: '1',
                    borderRadius: '15px',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>
                        ✨ {currentStep === 'origin' 
                            ? 'Continuar al Destino'
                            : 'Confirmar SafePoints'
                        } 
                    </span>
                    <span style={{
                        backgroundColor: '#1d4ed8',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginLeft: '8px'
                    }}>
                        {currentStep === 'origin' 
                            ? originSafePoints.size 
                            : (originSafePoints.size + destinationSafePoints.size)
                        }
                    </span>
                </div>
            </div>
            )}

            {/* Modal para proponer SafePoint */}
            <Modal
                opened={showProposalModal}
                onClose={() => setShowProposalModal(false)}
                title="Proponer Nuevo SafePoint"
                size="sm"
                styles={{
                    content: {
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white'
                    },
                    header: {
                        background: 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        color: 'white',
                        fontWeight: 600
                    }
                }}
            >
                <Stack gap="md">
                    <TextInput
                        label="Nombre del lugar"
                        placeholder="Ej: Terminal de Transporte Sur"
                        required
                        value={proposalData.name}
                        onChange={(e) => setProposalData(prev => ({ ...prev, name: e.target.value }))}
                        styles={{
                            label: { color: 'white' },
                            input: {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white'
                            }
                        }}
                    />

                    <Select
                        label="Categoría"
                        required
                        value={proposalData.category}
                        onChange={(value) => setProposalData(prev => ({ 
                            ...prev, 
                            category: value as SafePointCategory 
                        }))}
                        data={Object.entries(categoryConfig).map(([key, config]) => ({
                            value: key,
                            label: config.name
                        }))}
                        styles={{
                            label: { color: 'white' },
                            input: {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white'
                            }
                        }}
                    />

                    <TextInput
                        label="Dirección"
                        placeholder="Dirección completa del lugar"
                        required
                        value={proposalData.address}
                        onChange={(e) => setProposalData(prev => ({ ...prev, address: e.target.value }))}
                        styles={{
                            label: { color: 'white' },
                            input: {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white'
                            }
                        }}
                    />

                    <Textarea
                        label="Razón de la propuesta"
                        placeholder="¿Por qué consideras que este lugar debería ser un SafePoint?"
                        required
                        value={proposalData.reason}
                        onChange={(e) => setProposalData(prev => ({ ...prev, reason: e.target.value }))}
                        styles={{
                            label: { color: 'white' },
                            input: {
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white'
                            }
                        }}
                    />

                    <Group justify="flex-end" gap="sm">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowProposalModal(false)}
                            style={{
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white'
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={async () => {
                                // Implementar lógica de propuesta
                                notifications.show({
                                    title: 'SafePoint propuesto',
                                    message: 'Tu propuesta ha sido enviada para revisión',
                                    color: 'green'
                                });
                                setShowProposalModal(false);
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                border: 'none'
                            }}
                        >
                            Proponer
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
        </>
    );
}

export const Route = createFileRoute('/SafePoints/')({
    component: SafePointsView,
});

export default SafePointsView;
