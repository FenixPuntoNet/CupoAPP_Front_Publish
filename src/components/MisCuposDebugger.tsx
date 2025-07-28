import React, { useState } from 'react';
import { Button, Container, Stack, Alert, Code, Text, Title, Group } from '@mantine/core';
import { getMisCupos } from '@/services/cupos';
import { showNotification } from '@mantine/notifications';

export const MisCuposDebugger: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testMisCupos = async () => {
    setLoading(true);
    setResult(null);
    
    console.log('🔧 [MisCuposDebugger] Starting test...');
    
    try {
      const startTime = Date.now();
      const testResult = await getMisCupos();
      const endTime = Date.now();
      
      const fullResult = {
        ...testResult,
        responseTime: endTime - startTime,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ [MisCuposDebugger] Test completed:', fullResult);
      setResult(fullResult);
      
      if (testResult.success) {
        showNotification({
          title: '✅ Test exitoso',
          message: `Respuesta en ${endTime - startTime}ms`,
          color: 'green',
        });
      } else {
        showNotification({
          title: '⚠️ Test con errores',
          message: testResult.error || 'Error desconocido',
          color: 'yellow',
        });
      }
    } catch (error) {
      console.error('❌ [MisCuposDebugger] Test failed:', error);
      
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      
      setResult(errorResult);
      
      showNotification({
        title: '❌ Test fallido',
        message: errorResult.error,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md">
      <Title order={2} mb="md">🔧 Mis Cupos Debugger</Title>
      
      <Stack gap="md">
        <Group>
          <Button 
            onClick={testMisCupos} 
            loading={loading}
            disabled={loading}
          >
            Probar Endpoint /cupos/mis-cupos
          </Button>
        </Group>
        
        {result && (
          <Alert 
            color={result.success ? "green" : "red"} 
            title={`Test Result - ${result.success ? "SUCCESS" : "FAILED"}`}
          >
            <Stack gap="sm">
              <Text size="sm" fw={600}>
                Timestamp: {result.timestamp}
              </Text>
              
              {result.responseTime && (
                <Text size="sm" fw={600}>
                  Response Time: {result.responseTime}ms
                </Text>
              )}
              
              <Text size="sm" fw={600}>Resultado completo:</Text>
              <Code block style={{ maxHeight: '400px', overflow: 'auto' }}>
                {JSON.stringify(result, null, 2)}
              </Code>
            </Stack>
          </Alert>
        )}
        
        <Alert color="blue" title="Instrucciones">
          <Text size="sm">
            Este debugger prueba específicamente el endpoint <Code>/cupos/mis-cupos</Code> que está causando 
            la carga infinita. Observa la consola del navegador para logs detallados y verifica:
          </Text>
          <ul>
            <li>Si hay errores de red (401, 403, 500)</li>
            <li>Si el endpoint responde en tiempo razonable (&lt; 10s)</li>
            <li>Si la estructura de datos es correcta</li>
            <li>Si se activan los fallbacks correctamente</li>
          </ul>
        </Alert>
      </Stack>
    </Container>
  );
};

export default MisCuposDebugger;
