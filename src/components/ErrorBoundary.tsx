import React from 'react';
import { Container, Text, Button, Title } from '@mantine/core';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container 
          size="sm" 
          style={{ 
            padding: '2rem',
            textAlign: 'center',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <AlertCircle size={64} color="#ff6b6b" style={{ marginBottom: '1rem' }} />
          <Title order={2} style={{ marginBottom: '1rem', color: '#ff6b6b' }}>
            Algo salió mal
          </Title>
          <Text size="lg" color="dimmed" style={{ marginBottom: '2rem' }}>
            Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
          </Text>
          <Button
            leftSection={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
            size="md"
          >
            Recargar página
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Text 
              size="sm" 
              color="red" 
              style={{ 
                marginTop: '2rem', 
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                textAlign: 'left',
                maxWidth: '100%',
                overflow: 'auto'
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </Text>
          )}
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
