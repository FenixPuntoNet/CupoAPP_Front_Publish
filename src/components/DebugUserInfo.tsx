import React, { useState, useEffect } from 'react';
import { Button, Card, Text, Stack, JsonInput, Modal } from '@mantine/core';
import { getCurrentUser } from '@/services/auth';
import { getCurrentUserProfile } from '@/services/profile';
import { getMyVehicle } from '@/services/vehicles';
import { Eye } from 'lucide-react';

interface UserDebugInfo {
  user: any;
  profile: any;
  vehicle: any;
}

export const DebugUserInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<UserDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando información de debug del usuario...');
      
      const [userResult, profileResult, vehicleResult] = await Promise.all([
        getCurrentUser(),
        getCurrentUserProfile(),
        getMyVehicle().catch(e => ({ success: false, error: e.message }))
      ]);

      const info = {
        user: userResult,
        profile: profileResult,
        vehicle: vehicleResult
      };

      console.log('📊 Información de debug cargada:', info);
      setDebugInfo(info);
    } catch (error) {
      console.error('❌ Error cargando información de debug:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const checkValidations = () => {
    if (!debugInfo) return null;

    const validations = [];
    
    // Validar usuario autenticado
    if (!debugInfo.user.success || !debugInfo.user.user) {
      validations.push('❌ Usuario NO autenticado');
    } else {
      validations.push('✅ Usuario autenticado');
    }

    // Validar perfil
    if (!debugInfo.profile.success || !debugInfo.profile.data) {
      validations.push('❌ Perfil NO encontrado');
    } else {
      validations.push('✅ Perfil encontrado');
      
      // Validar tipo de usuario
      const userType = debugInfo.profile.data.user_type || debugInfo.profile.data.status;
      if (userType !== 'DRIVER') {
        validations.push(`❌ NO es DRIVER (actual: ${userType})`);
      } else {
        validations.push('✅ Es DRIVER');
      }

      // Validar verificación
      const verification = debugInfo.profile.data.verification;
      if (verification !== 'VERIFICADO' && verification !== 'APPROVED') {
        validations.push(`❌ NO está verificado (actual: ${verification})`);
      } else {
        validations.push('✅ Está verificado');
      }
    }

    // Validar vehículo
    if (!debugInfo.vehicle.success || !debugInfo.vehicle.vehicle) {
      validations.push('❌ Vehículo NO encontrado');
    } else {
      validations.push('✅ Vehículo encontrado');
      
      const vehicleStatus = debugInfo.vehicle.vehicle.status;
      if (vehicleStatus !== 'activo') {
        validations.push(`❌ Vehículo NO activo (actual: ${vehicleStatus})`);
      } else {
        validations.push('✅ Vehículo activo');
      }
    }

    return validations;
  };

  const validations = checkValidations();
  const shouldBlockAccess = validations?.some(v => v.startsWith('❌'));

  return (
    <>
      <Card withBorder p="md" style={{ margin: '1rem 0' }}>
        <Stack gap="sm">
          <Text fw={500} size="lg">🔍 Debug: Información del Usuario</Text>
          
          {validations && (
            <Stack gap="xs">
              <Text fw={500} size="md" c={shouldBlockAccess ? 'red' : 'green'}>
                {shouldBlockAccess ? '🚫 ACCESO BLOQUEADO' : '✅ ACCESO PERMITIDO'}
              </Text>
              {validations.map((validation, index) => (
                <Text key={index} size="sm" ff="monospace">
                  {validation}
                </Text>
              ))}
            </Stack>
          )}
          
          <Button 
            onClick={() => setShowModal(true)}
            leftSection={<Eye size={16} />}
            variant="light"
            loading={loading}
          >
            Ver datos completos
          </Button>
          
          <Button 
            onClick={loadDebugInfo}
            variant="outline"
            loading={loading}
          >
            Recargar información
          </Button>
        </Stack>
      </Card>

      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title="Datos completos del usuario"
        size="xl"
      >
        {debugInfo && (
          <Stack gap="md">
            <div>
              <Text fw={500} mb="xs">Usuario:</Text>
              <JsonInput 
                value={JSON.stringify(debugInfo.user, null, 2)}
                readOnly
                minRows={6}
                maxRows={10}
              />
            </div>
            
            <div>
              <Text fw={500} mb="xs">Perfil:</Text>
              <JsonInput 
                value={JSON.stringify(debugInfo.profile, null, 2)}
                readOnly
                minRows={6}
                maxRows={10}
              />
            </div>
            
            <div>
              <Text fw={500} mb="xs">Vehículo:</Text>
              <JsonInput 
                value={JSON.stringify(debugInfo.vehicle, null, 2)}
                readOnly
                minRows={6}
                maxRows={10}
              />
            </div>
          </Stack>
        )}
      </Modal>
    </>
  );
};
