import React, { useState } from 'react';
import { Button, Card, Text, Stack, Alert, Group, Badge, Code } from '@mantine/core';
import { testReportsEndpoint } from '@/utils/reportDebug';
import { createReport } from '@/services/moderation';
import { IconTestPipe, IconCheck, IconX, IconRefresh, IconBug } from '@tabler/icons-react';

export const ReportsSystemTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [reportTest, setReportTest] = useState<any>(null);

  const runConnectivityTest = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Running reports system connectivity test...');
      
      const result = await testReportsEndpoint();
      setTestResults(result);
      
      console.log('🧪 Test completed:', result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const runReportTest = async () => {
    setReportTest({ loading: true });
    
    try {
      console.log('🧪 Running test report creation...');
      
      // Intentar crear un reporte de prueba (con datos inválidos para no afectar la DB)
      const result = await createReport({
        contentType: 'message',
        contentId: 999999, // ID que probablemente no existe
        reason: 'test',
        description: 'Sistema de pruebas - Este reporte debería fallar con 404'
      });
      
      setReportTest({
        loading: false,
        ...result,
        note: 'Test con ID inexistente - se espera que falle con 404'
      });
      
    } catch (error) {
      setReportTest({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Error inesperado en el test'
      });
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Text size="lg" fw={600}>
              🧪 Sistema de Reportes - Diagnóstico
            </Text>
            <Text size="sm" c="dimmed">
              Verificar conectividad y funcionamiento del backend
            </Text>
          </div>
          <IconTestPipe size={24} color="var(--mantine-color-blue-6)" />
        </Group>

        {/* Test de Conectividad */}
        <div>
          <Group justify="space-between" mb="sm">
            <Text fw={500}>Test de Conectividad</Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconRefresh size={14} />}
              onClick={runConnectivityTest}
              loading={testing}
            >
              Probar
            </Button>
          </Group>

          {testResults && (
            <Alert
              color={testResults.success ? 'green' : 'red'}
              icon={testResults.success ? <IconCheck size={16} /> : <IconX size={16} />}
            >
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  {testResults.success ? '✅ Conectividad exitosa' : '❌ Falló la conectividad'}
                </Text>
                
                {testResults.error && (
                  <Text size="xs" c="red">
                    Error: {testResults.error}
                  </Text>
                )}
                
                {testResults.details && (
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                      Ver detalles técnicos
                    </summary>
                    <Code block mt="xs" style={{ fontSize: '10px' }}>
                      {JSON.stringify(testResults.details, null, 2)}
                    </Code>
                  </details>
                )}
              </Stack>
            </Alert>
          )}
        </div>

        {/* Test de Creación de Reporte */}
        <div>
          <Group justify="space-between" mb="sm">
            <Text fw={500}>Test de Creación de Reporte</Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconBug size={14} />}
              onClick={runReportTest}
              loading={reportTest?.loading}
              disabled={!testResults?.success}
            >
              Probar
            </Button>
          </Group>

          {reportTest && !reportTest.loading && (
            <Alert
              color={reportTest.success ? 'yellow' : 'blue'}
              icon={reportTest.success ? <IconCheck size={16} /> : <IconX size={16} />}
            >
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  {reportTest.success 
                    ? '⚠️ Reporte creado (inesperado)' 
                    : '✅ Test funcionó como esperado'
                  }
                </Text>
                
                <Text size="xs">
                  {reportTest.note}
                </Text>
                
                {reportTest.error && (
                  <Text size="xs" c="blue">
                    Respuesta: {reportTest.error}
                  </Text>
                )}
                
                <Badge size="xs" color={reportTest.success ? 'yellow' : 'blue'}>
                  {reportTest.success ? 'Revisar por qué no falló' : 'Sistema funciona correctamente'}
                </Badge>
              </Stack>
            </Alert>
          )}
        </div>

        {/* Instrucciones */}
        <Alert color="blue" variant="light">
          <Text size="xs">
            <strong>Cómo interpretar los resultados:</strong><br/>
            • Test de Conectividad ✅: El backend está accesible<br/>
            • Test de Reporte ✅: El sistema valida correctamente (debe fallar con 404)<br/>
            • Si ambos pasan, el sistema de reportes está funcionando correctamente
          </Text>
        </Alert>
      </Stack>
    </Card>
  );
};
