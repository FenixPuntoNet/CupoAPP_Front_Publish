import React, { useState } from 'react';
import { getCurrentUser } from '@/services/auth';
import { bookTrip } from '@/services/reservas';
import { createBookingWithSafePoints } from '@/services/booking-safepoints';
import ReservationSuccessModal from '@/components/ReservationModals/ReservationSuccessModal';
import type { Trip } from '@/types/Trip';
import type { TripSearchResult } from '@/services/trips';

import { PassengerCountModal } from './PassengerCountModal';
import { SafePointChoiceModal } from './SafePointChoiceModal';
import { ConfirmationModal } from './ConfirmationModal';

interface Passenger {
    fullName: string;
    identificationNumber: string;
}

interface TripReservationModalProps {
    trip: Trip;
    isOpen: boolean;
    onClose: () => void;
}

type FlowStep = 'passenger-info' | 'safepoint-choice' | 'confirmation' | 'success';

export const TripReservationModal: React.FC<TripReservationModalProps> = ({ trip, isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState<FlowStep>('passenger-info');
    const [passengerCount, setPassengerCount] = useState(1);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [useSafePoints, setUseSafePoints] = useState(false);
    const [selectedPickupId, setSelectedPickupId] = useState<number>();
    const [selectedDropoffId, setSelectedDropoffId] = useState<number>();
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingResult, setBookingResult] = useState<any>(null);

    // Step 1: Passenger Info (Combined count + details)
    const handlePassengerInfoNext = (count: number, passengerData: Passenger[]) => {
        setPassengerCount(count);
        setPassengers(passengerData);
        setCurrentStep('safepoint-choice');
    };

    // Step 2: SafePoint Choice
    const handleSafePointChoiceNext = (shouldUseSafePoints: boolean, pickupId?: number, dropoffId?: number) => {
        setUseSafePoints(shouldUseSafePoints);
        setSelectedPickupId(pickupId);
        setSelectedDropoffId(dropoffId);
        setCurrentStep('confirmation');
    };

    const handleSafePointChoiceBack = () => {
        setCurrentStep('passenger-info');
    };

    // Step 3: Confirmation
    const handleConfirmationBack = () => {
        setCurrentStep('safepoint-choice');
    };

    const handleFinalConfirmation = async () => {
        try {
            setIsProcessing(true);
            
            const user = await getCurrentUser();
            if (!user.success || !user.user) {
                console.error('Usuario no autenticado');
                return;
            }

            const passengerData = passengers.map(passenger => ({
                fullName: passenger.fullName,
                identificationNumber: passenger.identificationNumber
            }));

            let result;

            if (useSafePoints && (selectedPickupId || selectedDropoffId)) {
                console.log('🎫 Creando reserva CON SafePoints seleccionados');
                result = await createBookingWithSafePoints(
                    Number(trip.id),
                    passengerCount,
                    selectedPickupId,
                    selectedDropoffId,
                    passengerData
                );
            } else {
                console.log('�� Creando reserva SIN SafePoints (método tradicional)');
                result = await bookTrip(
                    Number(trip.id),
                    passengerData,
                    passengerCount
                );
            }
            
            if (result.success) {
                const bookingData = (result as any).booking || (result as any).data;
                setBookingResult(bookingData);
                setCurrentStep('success');
            } else {
                throw new Error((result as any).error || 'Error creando reserva');
            }
            
        } catch (error) {
            console.error('❌ Error creando reserva final:', error);
            alert('Error creando la reserva. Por favor intenta nuevamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSuccessClose = () => {
        onClose();
        // No navegamos, permanecemos en la página de búsqueda
    };

    const tripForSuccessModal: TripSearchResult = {
        id: trip.id.toString(),
        user_id: trip.user_id,
        origin: trip.origin.address,
        destination: trip.destination.address,
        dateTime: trip.dateTime,
        pricePerSeat: trip.pricePerSeat,
        seats: trip.seats,
        allowPets: false,
        allowSmoking: false,
        selectedRoute: trip.selectedRoute || { duration: 'N/A', distance: 'N/A' },
        driverName: trip.driverName || 'No disponible',
        photo: trip.photo || '',
        vehicle: {
            brand: trip.vehicle?.brand || '',
            model: trip.vehicle?.model || '',
            plate: trip.vehicle?.plate || '',
            color: trip.vehicle?.color || '',
            photo_url: trip.vehicle?.photo_url || '',
            year: trip.vehicle?.year?.toString() || ''
        },
        rating: undefined
    };

    return (
        <>
            {/* Step 1: Passenger Info (Combined) */}
            <PassengerCountModal
                trip={trip}
                isOpen={isOpen && currentStep === 'passenger-info'}
                onClose={onClose}
                onNext={handlePassengerInfoNext}
            />

            {/* Step 2: SafePoint Choice */}
            <SafePointChoiceModal
                isOpen={isOpen && currentStep === 'safepoint-choice'}
                onClose={onClose}
                onNext={handleSafePointChoiceNext}
                onBack={handleSafePointChoiceBack}
            />

            {/* Step 3: Confirmation */}
            <ConfirmationModal
                trip={trip}
                isOpen={isOpen && currentStep === 'confirmation'}
                onClose={onClose}
                onConfirm={handleFinalConfirmation}
                onBack={handleConfirmationBack}
                passengers={passengers}
                useSafePoints={useSafePoints}
                isLoading={isProcessing}
            />

            {/* Step 4: Success */}
            {currentStep === 'success' && (
                <ReservationSuccessModal
                    isOpen={true}
                    onClose={handleSuccessClose}
                    trip={tripForSuccessModal}
                    passengers={passengerCount}
                    totalPrice={trip.pricePerSeat * passengerCount}
                    onConfirm={handleSuccessClose}
                    isConfirming={false}
                    bookingResult={bookingResult}
                />
            )}
        </>
    );
};
