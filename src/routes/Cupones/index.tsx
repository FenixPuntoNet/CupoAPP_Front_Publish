import { createFileRoute, useNavigate } from '@tanstack/react-router';
import styles from './index.module.css';
import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Group,
  Modal,
  Card,
  Divider,
  ScrollArea,
  Badge,
  Avatar,
  Paper,
  Space,
} from '@mantine/core';
import { CheckCircle, XCircle, ArrowLeft, Gift } from 'lucide-react';
import { getCurrentUser } from '@/services/auth';
import { 
  getRedeemedCoupons, 
  redeemCoupon, 
  getReferralInfo, 
  registerReferral 
} from '@/services/cupones';

const CuponesView = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [modal, setModal] = useState<{
    opened: boolean;
    success: boolean;
    message: string;
    title: string;
    icon?: React.ReactNode;
  }>({ opened: false, success: false, message: '', title: '' });
  const [redeemedCoupons, setRedeemedCoupons] = useState<
    { code: string; balance: number; created_at: string }[]
  >([]);
  const [referral, setReferral] = useState<null | {
    promoter_card_code: string;
    promoter_user: { full_name: string; avatar_url?: string } | null;
  }>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const loadUserData = async () => {
      try {
        const response = await getCurrentUser();
        if (response.success && response.user?.id) {
          setUserId(response.user.id);
          fetchRedeemed();
          fetchReferral();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // --- CUPONES ---
  const fetchRedeemed = async () => {
    try {
      const result = await getRedeemedCoupons();
      if (result.success && result.data) {
        setRedeemedCoupons(result.data);
      }
    } catch (error) {
      console.error('Error fetching redeemed coupons:', error);
    }
  };

  const handleRedeem = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!userId || !code) return;

    setLoadingCoupon(true);

    try {
      const result = await redeemCoupon(code);
      
      if (result.success && result.data) {
        setModal({
          opened: true,
          success: true,
          title: '¡Cupón redimido!',
          message: result.data.message,
          icon: <Gift size={48} color="#00d084" />,
        });
        setCodeInput('');
        fetchRedeemed();
      } else {
        setModal({
          opened: true,
          success: false,
          title: 'Error al redimir cupón',
          message: result.error || 'Error desconocido',
          icon: <XCircle size={48} color="#e03131" />,
        });
      }
    } catch (error) {
      setModal({
        opened: true,
        success: false,
        title: 'Error',
        message: 'Error al procesar la solicitud',
        icon: <XCircle size={48} color="#e03131" />,
      });
    }

    setLoadingCoupon(false);
  };

  // --- REFERIDOS ---
  const fetchReferral = async () => {
    try {
      const result = await getReferralInfo();
      if (result.success && result.data) {
        const referralData = result.data.referral;
        if (referralData) {
          setReferral({
            promoter_card_code: referralData.promoter_card_code,
            promoter_user: referralData.promoter_user ? {
              full_name: referralData.promoter_user.full_name,
              avatar_url: referralData.promoter_user.avatar_url || undefined
            } : null
          });
        } else {
          setReferral(null);
        }
      }
    } catch (error) {
      console.error('Error fetching referral info:', error);
    }
  };

  const handleReferral = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!userId || !code) return;

    setLoadingReferral(true);

    try {
      const result = await registerReferral(code);
      
      if (result.success && result.data) {
        setModal({
          opened: true,
          success: true,
          title: '¡Código de referido registrado!',
          message: result.data.message,
          icon: <CheckCircle size={48} color="#00d084" />,
        });
        setReferralInput('');
        fetchReferral();
      } else {
        setModal({
          opened: true,
          success: false,
          title: 'Error al registrar referido',
          message: result.error || 'Error desconocido',
          icon: <XCircle size={48} color="#e03131" />,
        });
      }
    } catch (error) {
      setModal({
        opened: true,
        success: false,
        title: 'Error',
        message: 'Error al procesar la solicitud',
        icon: <XCircle size={48} color="#e03131" />,
      });
    }

    setLoadingReferral(false);
  };

  return (
    <Container className={styles.container}>
      <Group className={styles.header} gap="xs">
        <Button variant="subtle" onClick={() => navigate({ to: '/Perfil' })}>
          <ArrowLeft size={20} />
        </Button>
        <Title order={3}>Redimir Cupón / Referido</Title>
      </Group>

      {/* REFERIDO */}
      <Paper className={styles.referralSection} shadow="md" radius="lg" mb="xl">
        <Title order={4} className={styles.referralTitle} mb={8}>
          Programa de Referidos
        </Title>
        {referral ? (
          <Group align="center" gap="md" className={styles.referralInfo}>
            <Avatar
              src={referral.promoter_user?.avatar_url}
              alt={referral.promoter_user?.full_name}
              radius="xl"
              size={56}
              color="cyan"
            >
              {referral.promoter_user?.full_name?.[0] ?? "U"}
            </Avatar>
            <div>
              <Text fw={700} size="lg" className={styles.referralCongrats}>
                ¡Ya eres parte de la comunidad!
              </Text>
              <Text size="sm" c="dimmed">
                Te refirió: <b>{referral.promoter_user?.full_name || referral.promoter_card_code}</b>
              </Text>
              <Badge color="teal" variant="light" mt={4}>
                Referido activo
              </Badge>
            </div>
          </Group>
        ) : (
          <>
            <Text fw={700} size="md" mb={4}>
              ¿Tienes un código de referido?
            </Text>
            <Group gap="xs" align="flex-end">
              <TextInput
                placeholder="Código de referido"
                value={referralInput}
                onChange={(e) => setReferralInput(e.currentTarget.value.toUpperCase())}
                radius="md"
                size="md"
                className={styles.input}
                maxLength={12}
                disabled={loadingReferral}
              />
              <Button
                className={styles.referralButton}
                loading={loadingReferral}
                onClick={handleReferral}
                radius="md"
                size="md"
                disabled={!referralInput}
              >
                Registrar
              </Button>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Recibe <b>100 UniCoins</b> al ingresar un código válido. <br />
              <span style={{ color: '#00ff9d' }}>Los UniCoins no son dinero real.</span>
            </Text>
          </>
        )}
      </Paper>

      <Space h={32} />

      {/* CUPONES */}
      <Paper className={styles.couponSection} shadow="md" radius="lg" mb="xl">
        <Title order={4} className={styles.couponTitle} mb={8}>
          Redimir Cupón de Dinero
        </Title>
        <Text fw={700} size="md" mb={4}>
          Ingresa tu código de cupón para saldo real
        </Text>
        <Group gap="xs" align="flex-end">
          <TextInput
            placeholder="Ingresa tu código de cupón"
            value={codeInput}
            onChange={(e) => setCodeInput(e.currentTarget.value.toUpperCase())}
            radius="md"
            size="md"
            className={styles.input}
            maxLength={16}
            disabled={loadingCoupon}
          />
          <Button
            className={styles.redeemButton}
            loading={loadingCoupon}
            onClick={handleRedeem}
            radius="md"
            size="md"
            disabled={!codeInput}
          >
            Aplicar
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt={4}>
          El saldo de cupones es dinero real y se acredita a tu billetera.
        </Text>
      </Paper>

      <Divider my="xl" label="Cupones redimidos" labelPosition="center" />

      <ScrollArea style={{ maxHeight: '40vh' }}>
        {redeemedCoupons.length > 0 ? (
          redeemedCoupons.map((item, index) => (
            <Card key={index} shadow="xs" radius="md" withBorder mb="sm" className={styles.card}>
              <Group align="center" justify="space-between">
                <Group>
                  <CheckCircle size={20} color="#00d084" />
                  <Text>{item.code}</Text>
                </Group>
                <Text fw={700}>+${item.balance.toLocaleString()}</Text>
              </Group>
              <Text size="xs" color="dimmed">
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </Card>
          ))
        ) : (
          <Text color="dimmed" size="sm">
            Aún no has redimido ningún cupón.
          </Text>
        )}
      </ScrollArea>

      <Modal
        opened={modal.opened}
        onClose={() => setModal({ ...modal, opened: false })}
        centered
        size="sm"
        withCloseButton={false}
      >
        <Group align="center" justify="center" mb="md">
          {modal.icon}
        </Group>
        <Title order={4} style={{ textAlign: 'center' }} mb="xs">
          {modal.title}
        </Title>
        <Text style={{ textAlign: 'center' }} mb="md">
          {modal.message}
        </Text>
        <Button fullWidth onClick={() => setModal({ ...modal, opened: false })}>
          Aceptar
        </Button>
      </Modal>
    </Container>
  );
};

export const Route = createFileRoute('/Cupones/')({
  component: CuponesView,
});