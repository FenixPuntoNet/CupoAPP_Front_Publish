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
import { CheckCircle, XCircle, ArrowLeft, UserCheck, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const REWARD_AMOUNT = 100; // Unicoins por referido

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

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchRedeemed(uid);
        fetchReferral(uid);
      }
    });
  }, []);

  // --- CUPONES ---
  const fetchRedeemed = async (uid: string) => {
    const { data } = await supabase
      .from('driver_giftcards')
      .select('code, balance, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (data) setRedeemedCoupons(data);
  };

  const handleRedeem = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!userId || !code) return;

    setLoadingCoupon(true);

    const { data: giftcard, error: lookupError } = await supabase
      .from('code_giftcards')
      .select('*')
      .eq('code', code)
      .gt('expired_at', new Date().toISOString())
      .maybeSingle();

    if (!giftcard || lookupError) {
      setModal({
        opened: true,
        success: false,
        title: 'Código inválido o expirado',
        message: 'Este cupón no existe o ya expiró. Intenta con otro.',
        icon: <XCircle size={48} color="#e03131" />,
      });
      setLoadingCoupon(false);
      return;
    }

    const { data: alreadyUsed } = await supabase
      .from('driver_giftcards')
      .select('id')
      .eq('code', code)
      .eq('user_id', userId)
      .maybeSingle();

    if (alreadyUsed) {
      setModal({
        opened: true,
        success: false,
        title: 'Cupón ya usado',
        message: 'Este código ya fue redimido en tu cuenta.',
        icon: <XCircle size={48} color="#e03131" />,
      });
      setLoadingCoupon(false);
      return;
    }

    await supabase.from('driver_giftcards').insert({
      user_id: userId,
      code,
      balance: giftcard.value,
    });

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (!wallet) {
      setModal({
        opened: true,
        success: false,
        title: 'Sin wallet activa',
        message: 'Tu cuenta no tiene una billetera activa. Contáctanos.',
        icon: <XCircle size={48} color="#e03131" />,
      });
      setLoadingCoupon(false);
      return;
    }

    const newBalance = Number(wallet.balance ?? 0) + Number(giftcard.value);

    await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      transaction_type: 'cupon',
      amount: giftcard.value,
      detail: `Cupón redimido (${code})`,
      status: 'completado',
    });

    setModal({
      opened: true,
      success: true,
      title: '¡Cupón redimido!',
      message: `Se acreditaron $${giftcard.value} a tu billetera.`,
      icon: <Gift size={48} color="#00d084" />,
    });

    setCodeInput('');
    fetchRedeemed(userId);
    setLoadingCoupon(false);
  };

  // --- REFERIDOS ---
  const fetchReferral = async (uid: string) => {
    // Busca si ya tiene un referido registrado
    const { data: referralData } = await supabase
      .from('user_referrals')
      .select('promoter_card_code')
      .eq('referred_user_id', uid)
      .maybeSingle();

    if (referralData && referralData.promoter_card_code) {
      // Busca el perfil del promotor a través de user_cards y user_profiles
      const { data: promoterCard } = await supabase
        .from('user_cards')
        .select('user_id')
        .eq('card_code', referralData.promoter_card_code)
        .maybeSingle();

      let promoterProfile = null;
      if (promoterCard && promoterCard.user_id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, photo_user')
          .eq('user_id', promoterCard.user_id)
          .maybeSingle();

        if (profile) {
          promoterProfile = {
            full_name: `${profile.first_name} ${profile.last_name}`,
            avatar_url: profile.photo_user ?? undefined,
          };
        }
      }

      setReferral({
        promoter_card_code: referralData.promoter_card_code,
        promoter_user: promoterProfile,
      });
    } else {
      setReferral(null);
    }
  };

  const handleReferral = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!userId || !code) return;

    setLoadingReferral(true);

    // 1. Verifica si ya tiene referido
    const { data: alreadyReferred } = await supabase
      .from('user_referrals')
      .select('id')
      .eq('referred_user_id', userId)
      .maybeSingle();

    if (alreadyReferred) {
      setModal({
        opened: true,
        success: false,
        title: 'Ya tienes un referido',
        message: 'Solo puedes registrar un código de referido una vez.',
        icon: <UserCheck size={48} color="#00b4d8" />,
      });
      setLoadingReferral(false);
      return;
    }

    // 2. Busca el user_id del promotor en user_cards
    const { data: promoterCard } = await supabase
      .from('user_cards')
      .select('user_id')
      .eq('card_code', code)
      .maybeSingle();

    if (!promoterCard || !promoterCard.user_id) {
      setModal({
        opened: true,
        success: false,
        title: 'Código no válido',
        message: 'No encontramos ningún usuario con ese código.',
        icon: <XCircle size={48} color="#e03131" />,
      });
      setLoadingReferral(false);
      return;
    }

    // 3. Registra el referido
    await supabase.from('user_referrals').insert({
      referred_user_id: userId,
      promoter_card_code: code,
      referred_at: new Date().toISOString(),
    });

    // 4. Suma 100 unicoins al usuario (NO wallet, solo user_cards.unicoins)
    const { data: userCard } = await supabase
      .from('user_cards')
      .select('id, unicoins')
      .eq('user_id', userId)
      .single();

    if (userCard) {
      await supabase
        .from('user_cards')
        .update({
          unicoins: (userCard.unicoins ?? 0) + REWARD_AMOUNT,
        })
        .eq('id', userCard.id);
    }

    setModal({
      opened: true,
      success: true,
      title: '¡Código de referido registrado!',
      message: `¡Felicidades! Has recibido ${REWARD_AMOUNT} UniCoins por unirte con un código de referido.`,
      icon: <CheckCircle size={48} color="#00d084" />,
    });

    setReferralInput('');
    fetchReferral(userId);
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
              Recibe <b>{REWARD_AMOUNT} UniCoins</b> al ingresar un código válido. <br />
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