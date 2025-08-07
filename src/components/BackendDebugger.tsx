import { useState } from 'react';
import { Button, Card, Text, Stack, Alert, Group } from '@mantine/core';
import { IconBug, IconCheck, IconX } from '@tabler/icons-react';
import { testTripStartEndpoint, verifyBackendConnection } from '@/services/viajes';

interface BackendDebuggerProps {
  tripId?: number;
}

export const BackendDebugger: React.FC<BackendDebuggerProps> = ({ tripId = 9 }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log(`🧪 [BackendDebugger] Starting comprehensive test for trip ${tripId}...`);
      
      // Test 1: Backend connectivity
      const backendTest = await verifyBackendConnection();
      console.log(`🔗 [BackendDebugger] Backend test:`, backendTest);
      
      // Test 2: Trip specific endpoint test
      const tripTest = await testTripStartEndpoint(tripId);
      console.log(`🚀 [BackendDebugger] Trip test:`, tripTest);
      
      setResults({
        backend: backendTest,
        trip: tripTest,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ [BackendDebugger] Test failed:`, error);
      setResults({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card withBorder padding="md" radius="md" style={{ marginBottom: '1rem' }}>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="lg" fw={600}>Backend Debugger</Text>
          <Text size="sm" c="dimmed">Trip ID: {tripId}</Text>
        </Group>
        
        <Button
          leftSection={<IconBug size={16} />}
          onClick={runTest}
          loading={testing}
          color="blue"
          variant="light"
        >
          {testing ? 'Testing...' : 'Run Backend Test'}
        </Button>
        
        {results && (
          <Stack gap="xs">
            {results.error ? (
              <Alert icon={<IconX size={16} />} color="red" title="Test Failed">
                <Text size="sm">{results.error}</Text>
              </Alert>
            ) : (
              <>
                <Alert 
                  icon={results.backend?.success ? <IconCheck size={16} /> : <IconX size={16} />} 
                  color={results.backend?.success ? 'green' : 'red'} 
                  title="Backend Connectivity"
                >
                  <Text size="sm">
                    {results.backend?.success 
                      ? `Connected - Found ${results.backend.data?.trips_count || 0} trips`
                      : `Failed - ${results.backend?.error || 'Unknown error'}`
                    }
                  </Text>
                </Alert>
                
                <Alert 
                  icon={results.trip?.success ? <IconCheck size={16} /> : <IconX size={16} />} 
                  color={results.trip?.success ? 'green' : 'red'} 
                  title="Trip Endpoint Test"
                >
                  <Text size="sm">
                    {results.trip?.success 
                      ? 'Trip endpoint accessible and functional'
                      : `Failed - ${results.trip?.error || 'Unknown error'}`
                    }
                  </Text>
                </Alert>
              </>
            )}
            
            <Text size="xs" c="dimmed">
              Test completed at: {new Date(results.timestamp).toLocaleTimeString()}
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default BackendDebugger;
