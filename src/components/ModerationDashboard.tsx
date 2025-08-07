import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Button,
  Badge,
  Table,
  Modal,
  Textarea,
  Select,
  Alert,
  Tabs,
  Grid,
  ActionIcon,
  LoadingOverlay
} from '@mantine/core';
import {
  IconShield,
  IconFlag,
  IconUserX,
  IconCheck,
  IconX,
  IconEye,
  IconBan,
  IconChartBar
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { 
  getModerationStats, 
  getReportsStats,
  Report 
} from '@/services/moderation';
import styles from './ModerationDashboard.module.css';

interface ModerationDashboardProps {
  isAdmin?: boolean;
}

export const ModerationDashboard: React.FC<ModerationDashboardProps> = ({
  isAdmin = false
}) => {
  const [loading, setLoading] = useState(true);
  const [moderationStats, setModerationStats] = useState<any>(null);
  const [reportsStats, setReportsStats] = useState<any>(null);
  const [reports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processingReport, setProcessingReport] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      console.log('📊 Fetching moderation dashboard data...');
      
      // Fetch moderation stats
      const moderationResult = await getModerationStats();
      if (moderationResult.success) {
        setModerationStats(moderationResult.data);
      }

      // Fetch reports stats
      const reportsResult = await getReportsStats();
      if (reportsResult.success) {
        setReportsStats(reportsResult.data);
      }

      console.log('✅ Dashboard data fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar datos del dashboard',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport) return;

    setProcessingReport(true);
    
    try {
      console.log(`📝 ${status === 'resolved' ? 'Resolving' : 'Dismissing'} report:`, selectedReport.id);
      
      // Here you would call the backend API to update report status
      // const result = await updateReportStatus(selectedReport.id, { status, resolutionAction, resolutionNotes });
      
      notifications.show({
        title: 'Éxito',
        message: `Reporte ${status === 'resolved' ? 'resuelto' : 'descartado'} correctamente`,
        color: 'green'
      });

      setResolutionModalOpen(false);
      setSelectedReport(null);
      setResolutionAction('');
      setResolutionNotes('');
      
      // Refresh data
      fetchDashboardData();
      
    } catch (error) {
      console.error('❌ Failed to process report:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al procesar el reporte',
        color: 'red'
      });
    } finally {
      setProcessingReport(false);
    }
  };

  if (!isAdmin) {
    return (
      <Container size="sm" className={styles.container}>
        <Alert
          icon={<IconBan size={20} />}
          title="Acceso denegado"
          color="red"
        >
          No tienes permisos para acceder al dashboard de moderación.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" className={styles.container}>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="xl">
        {/* Header */}
        <Group>
          <IconShield size={32} color="#00ff9d" />
          <div>
            <Title order={1} className={styles.title}>
              Dashboard de Moderación
            </Title>
            <Text className={styles.subtitle}>
              Panel de control para la gestión de contenido y usuarios
            </Text>
          </div>
        </Group>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Group justify="apart">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Reportes Pendientes
                  </Text>
                  <Text fw={700} size="xl">
                    {reportsStats?.pendingReports || 0}
                  </Text>
                </div>
                <IconFlag size={24} color="#ff6b6b" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Group justify="apart">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Usuarios Suspendidos
                  </Text>
                  <Text fw={700} size="xl">
                    {moderationStats?.activeSuspensions || 0}
                  </Text>
                </div>
                <IconUserX size={24} color="#ff6b6b" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Group justify="apart">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Total Reportes
                  </Text>
                  <Text fw={700} size="xl">
                    {reportsStats?.totalReports || 0}
                  </Text>
                </div>
                <IconChartBar size={24} color="#00ff9d" />
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Group justify="apart">
                <div>
                  <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                    Bloqueos Activos
                  </Text>
                  <Text fw={700} size="xl">
                    {moderationStats?.activeBlocks || 0}
                  </Text>
                </div>
                <IconBan size={24} color="#ffa500" />
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Main Content */}
        <Tabs defaultValue="reports">
          <Tabs.List>
            <Tabs.Tab value="reports" leftSection={<IconFlag size={16} />}>
              Reportes
            </Tabs.Tab>
            <Tabs.Tab value="stats" leftSection={<IconChartBar size={16} />}>
              Estadísticas
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="reports" pt="md">
            <Card className={styles.reportsCard}>
              <Title order={3} mb="md">Reportes Recientes</Title>
              
              {reports.length === 0 ? (
                <Text ta="center" c="dimmed" py="xl">
                  No hay reportes pendientes
                </Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th>Razón</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {reports.map((report) => (
                      <Table.Tr key={report.id}>
                        <Table.Td>
                          <Badge variant="light">
                            {report.contentType === 'message' ? 'Mensaje' : 
                             report.contentType === 'profile' ? 'Perfil' : 'Viaje'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{report.reason}</Table.Td>
                        <Table.Td>
                          <Badge 
                            color={report.status === 'pending' ? 'yellow' : 
                                   report.status === 'resolved' ? 'green' : 'gray'}
                          >
                            {report.status === 'pending' ? 'Pendiente' : 
                             report.status === 'resolved' ? 'Resuelto' : 'Descartado'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              onClick={() => {
                                setSelectedReport(report);
                                setResolutionModalOpen(true);
                              }}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="stats" pt="md">
            <Grid>
              <Grid.Col span={12}>
                <Card>
                  <Title order={3} mb="md">Estadísticas Detalladas</Title>
                  <Text c="dimmed" ta="center" py="xl">
                    Estadísticas detalladas próximamente...
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Resolution Modal */}
      <Modal
        opened={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        title="Resolver Reporte"
        size="md"
      >
        <Stack gap="md">
          {selectedReport && (
            <>
              <Text><strong>Tipo:</strong> {selectedReport.contentType}</Text>
              <Text><strong>Razón:</strong> {selectedReport.reason}</Text>
              {selectedReport.description && (
                <Text><strong>Descripción:</strong> {selectedReport.description}</Text>
              )}
              
              <Select
                label="Acción de resolución"
                placeholder="Selecciona una acción"
                value={resolutionAction}
                onChange={(value) => setResolutionAction(value || '')}
                data={[
                  { value: 'dismissed', label: 'Descartar reporte' },
                  { value: 'content_removed', label: 'Contenido removido' },
                  { value: 'user_warned', label: 'Usuario advertido' },
                  { value: 'user_suspended', label: 'Usuario suspendido' }
                ]}
              />

              <Textarea
                label="Notas de resolución"
                placeholder="Agrega notas sobre la resolución..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.currentTarget.value)}
                rows={3}
              />

              <Group justify="flex-end">
                <Button
                  variant="light"
                  onClick={() => setResolutionModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={() => handleReportAction('dismissed')}
                  loading={processingReport}
                >
                  Descartar
                </Button>
                <Button
                  leftSection={<IconCheck size={16} />}
                  onClick={() => handleReportAction('resolved')}
                  loading={processingReport}
                  disabled={!resolutionAction}
                >
                  Resolver
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
};
