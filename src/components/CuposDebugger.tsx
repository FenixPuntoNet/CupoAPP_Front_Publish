import React, { useState } from 'react';
import { Button, Container, TextInput, Stack, Alert, Code, Text, Title } from '@mantine/core';
import { debugCuposReservados, getCuposReservados, debugMisCupos, getMisCupos } from '@/services/cupos';
import { getTripPassengerCount } from '@/services/actividades';

export const CuposDebugger: React.FC = () => {
  const [tripId, setTripId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testAllEndpoints = async () => {
    if (!tripId || isNaN(Number(tripId))) {
      alert('Please enter a valid trip ID');
      return;
    }

    setLoading(true);
    const tripIdNum = Number(tripId);
    const testResults: any = {};

    try {
      // Test 1: Debug endpoint
      console.log('🔧 Testing debug endpoint...');
      const debugResult = await debugCuposReservados(tripIdNum);
      testResults.debug = debugResult;

      // Test 2: Main cupos endpoint
      console.log('🎫 Testing main cupos endpoint...');
      const cuposResult = await getCuposReservados(tripIdNum);
      testResults.cupos = cuposResult;

      // Test 3: Passenger count endpoint
      console.log('👥 Testing passenger count endpoint...');
      const passengerResult = await getTripPassengerCount(tripIdNum);
      testResults.passengers = passengerResult;

      // Test 4: Mis cupos endpoint (independent of tripId)
      console.log('🎫 Testing mis-cupos endpoint...');
      const misCuposResult = await getMisCupos();
      testResults.misCupos = misCuposResult;

      // Test 5: Debug mis cupos endpoint
      console.log('🔧 Testing debug mis-cupos endpoint...');
      const debugMisCuposResult = await debugMisCupos();
      testResults.debugMisCupos = debugMisCuposResult;

      setResults(testResults);
    } catch (error) {
      console.error('Test error:', error);
      setResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md">
      <Title order={2} mb="md">🔧 Cupos Backend Debugger</Title>
      
      <Stack gap="md">
        <TextInput
          label="Trip ID"
          placeholder="Enter trip ID to test"
          value={tripId}
          onChange={(e) => setTripId(e.currentTarget.value)}
        />
        
        <Button 
          onClick={testAllEndpoints} 
          loading={loading}
          disabled={!tripId || isNaN(Number(tripId))}
        >
          Test All Endpoints
        </Button>

        <Button 
          onClick={async () => {
            setLoading(true);
            try {
              const misCuposResult = await getMisCupos();
              const debugResult = await debugMisCupos();
              setResults({ 
                misCupos: misCuposResult, 
                debugMisCupos: debugResult 
              });
            } catch (error) {
              setResults({ error: error instanceof Error ? error.message : String(error) });
            } finally {
              setLoading(false);
            }
          }}
          loading={loading}
        >
          Test Mis Cupos Only
        </Button>
        
        {results && (
          <Alert color="blue" title="Test Results">
            <Stack gap="sm">
              <Text size="sm" fw={600}>Debug Endpoint:</Text>
              <Code block>{JSON.stringify(results.debug, null, 2)}</Code>
              
              <Text size="sm" fw={600}>Cupos Endpoint:</Text>
              <Code block>{JSON.stringify(results.cupos, null, 2)}</Code>
              
              <Text size="sm" fw={600}>Passenger Count Endpoint:</Text>
              <Code block>{JSON.stringify(results.passengers, null, 2)}</Code>
              
              {results.misCupos && (
                <>
                  <Text size="sm" fw={600}>Mis Cupos Endpoint:</Text>
                  <Code block>{JSON.stringify(results.misCupos, null, 2)}</Code>
                </>
              )}
              
              {results.debugMisCupos && (
                <>
                  <Text size="sm" fw={600}>Debug Mis Cupos Endpoint:</Text>
                  <Code block>{JSON.stringify(results.debugMisCupos, null, 2)}</Code>
                </>
              )}
            </Stack>
          </Alert>
        )}
      </Stack>
    </Container>
  );
};

export default CuposDebugger;
