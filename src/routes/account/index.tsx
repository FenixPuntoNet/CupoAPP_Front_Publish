import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Box,
  Divider,
  Title,
  Loader,
  Tooltip,
  Avatar,
  Container,
  Progress,
  Center,
  rem,
  Button,
  CopyButton,
  ActionIcon,
} from '@mantine/core'
import {
  IconCreditCard,
  IconUser,
  IconCalendar,
  IconArrowUpRight,
  IconLeaf,
  IconWallet,
  IconIceCream2,
  IconCheck,
  IconGift,
  IconCopy,
  IconChevronLeft,
  IconSparkles,
  IconFriends,
  IconTrophy,
} from '@tabler/icons-react'
import { IconExchange, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/Database'
import './index.css'

type UserCard = Database['public']['Tables']['user_cards']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type WalletData = {
  id: number
  balance: number
  frozen_balance: number
}
type GoalDefinition = {
  id: number
  type: 'referral' | 'streak_total' | 'streak_passenger' | 'streak_driver'
  name: string
  goal: number
  reward_unicoins: number
  is_active: boolean
}
type GoalClaim = {
  goal_id: number
  claimed_at: string
}

function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
        borderRadius: '50%',
        width: rem(size),
        height: rem(size),
        textAlign: 'center',
        lineHeight: rem(size),
        fontWeight: 700,
        fontSize: rem(size * 0.68),
        color: '#fff',
        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.15)',
        marginRight: rem(4),
      }}
      aria-label="UniCoin"
    >
      Ʉ
    </span>
  )
}

function AccountView() {
  const navigate = useNavigate()
  const [card, setCard] = useState<UserCard | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [wallet, setWallet] = useState<WalletData>({ id: 0, balance: 0, frozen_balance: 0 })
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Metas y reclamos
  const [goalDefinitions, setGoalDefinitions] = useState<GoalDefinition[]>([])
  const [goalClaims, setGoalClaims] = useState<GoalClaim[]>([])

  // Estadísticas
  const [referrals, setReferrals] = useState<number>(0)
  const [passengerTrips, setPassengerTrips] = useState<number>(0)
  const [driverTrips, setDriverTrips] = useState<number>(0)
  const [co2Saved, setCo2Saved] = useState<number>(0)

  // Modal para mostrar la "parte de atrás" de la tarjeta (card-profile)
  const [showCardBack, setShowCardBack] = useState(false)

  // MODAL DE META
  const [metaModal, setMetaModal] = useState<null | { meta: any; type: string }>(null)

  // Cargar datos principales y metas
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) {
          navigate({ to: '/Login' })
          return
        }
        setUserEmail(user.email ?? '')

        // Perfil
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (profileError) throw profileError
        setProfile(profileData)

        // Tarjeta
        const { data: cardData, error: cardError } = await supabase
          .from('user_cards')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (cardError) throw cardError
        setCard(cardData)

        // Wallet
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance, frozen_balance')
          .eq('user_id', user.id)
          .single()
        if (walletError) throw walletError
        setWallet({
          id: walletData?.id || 0,
          balance: walletData?.balance || 0,
          frozen_balance: walletData?.frozen_balance || 0,
        })

        // Metas activas
        const { data: goalsData, error: goalsError } = await supabase
          .from('goal_definitions')
          .select('*')
          .eq('is_active', true)
          .order('goal', { ascending: true })
        if (goalsError) throw goalsError
        setGoalDefinitions(goalsData || [])

        // Reclamos del usuario
        const { data: claimsData, error: claimsError } = await supabase
          .from('goal_claims')
          .select('goal_id, claimed_at')
          .eq('user_id', user.id)
        if (claimsError) throw claimsError
        setGoalClaims(claimsData || [])

        // Referidos
        const { data: cardData2 } = await supabase
          .from('user_cards')
          .select('card_code')
          .eq('user_id', user.id)
          .single()
        const cardCode = cardData2?.card_code
        let referralCount = 0
        if (cardCode) {
          const { count: referralCountRaw } = await supabase
            .from('user_referrals')
            .select('id', { count: 'exact', head: true })
            .eq('promoter_card_code', cardCode)
          referralCount = referralCountRaw || 0
        }
        setReferrals(referralCount)

        // Viajes como pasajero SOLO CONFIRMADOS
        const { count: passengerCount } = await supabase
          .from('booking_passengers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
        setPassengerTrips(passengerCount || 0)

        // Viajes como conductor SOLO FINALIZADOS
        const { count: driverCount } = await supabase
          .from('trips')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'finished')
        setDriverTrips(driverCount || 0)

        // Ecofriendly
        const totalTrips = (passengerCount || 0) + (driverCount || 0)
        const kmPerTrip = 20
        const co2PerKm = 0.21
        setCo2Saved(Number((totalTrips * kmPerTrip * co2PerKm).toFixed(2)))
      } catch (err: any) {
        setError('No se pudo cargar la información. Intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [navigate])

  // Reclamar UniCoins de cualquier meta
  const handleClaimGoal = async (goal: GoalDefinition) => {
    if (!card || !profile) return
    if (goalClaims.some((c) => c.goal_id === goal.id)) return

    let userProgress = 0
    if (goal.type === 'referral') userProgress = referrals
    if (goal.type === 'streak_total') userProgress = passengerTrips + driverTrips
    if (goal.type === 'streak_passenger') userProgress = passengerTrips
    if (goal.type === 'streak_driver') userProgress = driverTrips
    if (userProgress < goal.goal) return

    await supabase.from('goal_claims').insert({
      user_id: card.user_id,
      goal_id: goal.id,
      claimed_at: new Date().toISOString(),
    })

    await supabase
      .from('user_cards')
      .update({ unicoins: (card.unicoins ?? 0) + goal.reward_unicoins })
      .eq('id', card.id)

    setCard((prev) => prev ? { ...prev, unicoins: (prev.unicoins ?? 0) + goal.reward_unicoins } : prev)
    setGoalClaims((prev) => [...prev, { goal_id: goal.id, claimed_at: new Date().toISOString() }])
  }

  // --- MODAL COMPONENT ---
  function MetaModal() {
    if (!metaModal) return null
    const { meta, type } = metaModal
    let progress = 0
    let total = 0
    let desc = ''
    if (type === 'referral') {
      progress = referrals
      total = meta.goal
      desc = `Invita a ${meta.goal} amigos y gana ${meta.reward_unicoins} UniCoins.`
    } else if (type === 'streak_total') {
      progress = (passengerTrips + driverTrips)
      total = meta.goal
      desc = `Completa ${meta.goal} viajes en total y gana ${meta.reward_unicoins} UniCoins.`
    } else if (type === 'streak_passenger') {
      progress = passengerTrips
      total = meta.goal
      desc = `Haz ${meta.goal} viajes como pasajero y gana ${meta.reward_unicoins} UniCoins.`
    } else if (type === 'streak_driver') {
      progress = driverTrips
      total = meta.goal
      desc = `Haz ${meta.goal} viajes como conductor y gana ${meta.reward_unicoins} UniCoins.`
    }
    return (
      <div className="meta-modal-overlay" onClick={() => setMetaModal(null)}>
        <div className="meta-modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setMetaModal(null)}>
            <IconX size={22} />
          </button>
          <div className="meta-title">{meta.name}</div>
          <div className="meta-desc">{desc}</div>
          <div className="meta-progress">
            <Progress
              value={Math.min((progress / total) * 100, 100)}
              color={progress >= total ? 'teal' : 'yellow'}
              size="md"
              radius="xl"
              striped
              animated
            />
            <Text ta="center" mt={8} style={{ color: '#ffd700', fontWeight: 700 }}>
              {progress}/{total} {type === 'referral' ? 'referidos' : 'viajes'}
            </Text>
          </div>
          <div className="meta-reward">
            Recompensa: +{meta.reward_unicoins}Ʉ UniCoins
          </div>
          <Text ta="center" size="sm" style={{ color: progress >= total ? '#3bd289' : '#fff' }}>
            {progress >= total
              ? '¡Meta alcanzada! Puedes reclamar tu recompensa.'
              : 'Sigue avanzando para lograr esta meta.'}
          </Text>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Center mih="60vh">
        <Loader size="lg" />
      </Center>
    )
  }

  if (error) {
    return (
      <Container fluid className="account-container">
        <Card shadow="sm" radius="md" p="lg" maw={420} mx="auto" mt="xl" withBorder>
          <Text color="red" ta="center">{error}</Text>
        </Card>
      </Container>
    )
  }

  if (!card || !profile) {
    return (
      <Container fluid className="account-container">
        <Card shadow="sm" radius="md" p="lg" maw={420} mx="auto" mt="xl" withBorder>
          <Text ta="center" c="dimmed">No tienes tarjeta activa.</Text>
        </Card>
      </Container>
    )
  }

  // Separa metas por tipo
  const referralGoals = goalDefinitions.filter((g) => g.type === 'referral')
  const streakTotalGoals = goalDefinitions.filter((g) => g.type === 'streak_total')
  const streakPassengerGoals = goalDefinitions.filter((g) => g.type === 'streak_passenger')
  const streakDriverGoals = goalDefinitions.filter((g) => g.type === 'streak_driver')

  // Calcula el progreso para cada meta
  const referralProgress = referralGoals.map((meta) => {
    const value = Math.min((referrals / meta.goal) * 100, 100)
    const completed = referrals >= meta.goal
    const claimed = goalClaims.some((c) => c.goal_id === meta.id)
    return { ...meta, value, completed, claimed }
  })
  const streakTotalProgress = streakTotalGoals.map((meta) => {
    const totalTrips = passengerTrips + driverTrips
    const value = Math.min((totalTrips / meta.goal) * 100, 100)
    const completed = totalTrips >= meta.goal
    const claimed = goalClaims.some((c) => c.goal_id === meta.id)
    return { ...meta, value, completed, claimed, userProgress: totalTrips }
  })
  const streakPassengerProgress = streakPassengerGoals.map((meta) => {
    const value = Math.min((passengerTrips / meta.goal) * 100, 100)
    const completed = passengerTrips >= meta.goal
    const claimed = goalClaims.some((c) => c.goal_id === meta.id)
    return { ...meta, value, completed, claimed, userProgress: passengerTrips }
  })
  const streakDriverProgress = streakDriverGoals.map((meta) => {
    const value = Math.min((driverTrips / meta.goal) * 100, 100)
    const completed = driverTrips >= meta.goal
    const claimed = goalClaims.some((c) => c.goal_id === meta.id)
    return { ...meta, value, completed, claimed, userProgress: driverTrips }
  })

  // Animación para la tarjeta (frente y reverso)
  function BankCardFront() {
    if (!card) return null
    return (
      <Card
        className="card-uni-wallet bank-card-front"
        shadow="lg"
        radius="md"
        withBorder
        onClick={() => setShowCardBack(true)}
        style={{
          cursor: 'pointer',
          transition: 'transform 0.3s cubic-bezier(.4,2,.3,1), box-shadow 0.2s',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div className="bank-card-chip" />
        <div className="bank-card-logo">
          <IconSparkles size={32} color="#fff" />
        </div>
        <div style={{height: '70px'}} />
        <div className="card-uni-wallet-row">
          <div className="card-uni-wallet-main">
            <Group gap={8} align="center" mb={4}>
              <IconWallet size={28} />
              <Text className="wallet-balance" fw={800}>
                ${wallet.balance.toLocaleString('es-CO')}
              </Text>
            </Group>
            <Group gap={6} align="center" mb={4} mt={-8}>
              <IconIceCream2 size={16} color="#3b82f6" />
              <Text size="xs" style={{ color: '#3b82f6', fontWeight: 600 }}>
                Saldo congelado: ${wallet.frozen_balance.toLocaleString('es-CO')}
              </Text>
            </Group>
            <Text size="sm" className="wallet-label" mb={8}>
              Pesos Colombianos
            </Text>
            <Divider my={8} color="rgba(255,255,255,0.2)" />
            <Group gap={8} align="center" mt={8}>
              <CoinIcon size={28} />
              <Text className="unicoin-balance" fw={700}>
                {card.unicoins?.toLocaleString() ?? 0} UC
              </Text>
            </Group>
            <Text size="xs" className="unicoin-label" mt={2}>
              UniCoins - Virtual
            </Text>
          </div>
          <div className="card-uni-wallet-side">
            <div className="card-uni-type">
              <span>{card.card_type?.toUpperCase() || 'GREEN'}</span>
              <Badge variant="light" size="sm" color="gray" ml={6}>
                Lv {card.card_level}
              </Badge>
            </div>
            <Tooltip label="Tu tarjeta digital">
              <Box mt={16}>
                <IconCreditCard size={36} />
              </Box>
            </Tooltip>
            <Text size="xs" className="card-uni-code" mt={12}>
              {card.card_code}
            </Text>
            <CopyButton value={card.card_code || ''}>
              {({ copied, copy }) => (
                <ActionIcon
                  variant="light"
                  color={copied ? 'teal' : 'gray'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    copy()
                  }}
                  style={{ marginTop: 8 }}
                  aria-label="Copiar código"
                >
                  <IconCopy size={16} />
                </ActionIcon>
              )}
            </CopyButton>
          </div>
        </div>
        <div className="bank-card-glow" />
      </Card>
    )
  }


  function BankCardBack() {
    if (!profile || !card) return null
    return (
      <div className="bank-card-back-outer">
        <Card
          className="card-profile bank-card-back"
          shadow="lg"
          radius="md"
          withBorder
          style={{
            margin: 0,
            boxShadow: '0 8px 32px #0a755733',
            border: 'none',
            maxWidth: '100%',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <ActionIcon
            variant="light"
            color="gray"
            size="lg"
            className="bank-card-back-close"
            onClick={() => setShowCardBack(false)}
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              zIndex: 2,
              background: '#fff',
              boxShadow: '0 2px 8px #0001',
            }}
            aria-label="Volver"
          >
            <IconChevronLeft size={22} />
          </ActionIcon>
          <div className="bank-card-stripe" />
          <div className="user-info">
            <Avatar
              src={profile.photo_user || undefined}
              alt={profile.first_name || ''}
              radius="xl"
              size={48}
              style={{
                border: '2px solid #3bd289',
                boxShadow: '0 2px 8px #3bd28944',
                background: '#fff',
              }}
            >
              {profile.first_name?.[0]}
            </Avatar>
            <div>
              <div className="name">
                {profile.first_name} {profile.last_name}
              </div>
              <div className="id">
                {profile.identification_number
                  ? `ID: ${profile.identification_number}`
                  : ''}
              </div>
            </div>
          </div>
          <div className="details">
            <div className="detail-line">
              <IconUser size={18} color="#0a7557" />
              <Text size="sm" c="black">{userEmail}</Text>
            </div>
            <div className="detail-line">
              <IconCalendar size={18} color="#0a7557" />
              <Text size="sm" c="black">
                Registrado el{' '}
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : ''}
              </Text>
            </div>
            <div className="detail-line">
              <IconArrowUpRight size={18} color="#0a7557" />
              <Text size="sm" c="black">Card Code: {card.card_code}</Text>
            </div>
          </div>
          <Divider my="md" />
          <Group justify="space-between" mt="sm">
            <Box>
              <Text size="xs" c="dimmed">
                Pasajero
              </Text>
              <Title order={4} c="black">{passengerTrips}</Title>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">
                Conductor
              </Text>
              <Title order={4} c="black">{driverTrips}</Title>
            </Box>
            <Box>
              <Group gap={4}>
                <IconLeaf size={18} color="#3bd289" />
                <Box>
                  <Text size="xs" c="dimmed">
                    CO₂ ahorrado
                  </Text>
                  <Title order={4} c="black">{co2Saved} kg</Title>
                </Box>
              </Group>
            </Box>
          </Group>
        </Card>
      </div>
    )
  }

  return (
    <Container fluid className="account-container">
      <Stack gap={20} align="center" py={24}>
        <div style={{ height: '10px' }} />
        <div className={`bank-card-3d${showCardBack ? ' show-back' : ''}`}>
          <div className="bank-card-3d-inner">
            <div className="bank-card-3d-front">
              <BankCardFront />
            </div>
            <div className="bank-card-3d-back">
              <BankCardBack />
            </div>
          </div>
        </div>
        <div style={{height: '40px'}} />
        {/* Espacio de referidos y rachas */}
        <div className="referrals-streaks-space">
          <div className="referrals-streaks-header">
            {/* Referidos */}
            <Box>
              <div className="referral-section-title">
                <IconFriends size={20} color="#ffd700" />
                <span>Referidos</span>
                <Badge color="yellow" size="sm">{referrals}</Badge>
              </div>
              <Stack gap={6}>
                {referralProgress.map((meta) => (
                  <Box
                    key={meta.id}
                    className="referral-meta-box"
                    onClick={() => setMetaModal({ meta, type: 'referral' })}
                  >
                    <Group gap={6} mb={2}>
                      <Text size="xs" fw={700} style={{ color: meta.completed ? '#3bd289' : '#ffd700' }}>
                        {meta.name}
                      </Text>
                      <Badge
                        color={meta.completed ? 'teal' : 'yellow'}
                        size="xs"
                        variant={meta.completed ? 'filled' : 'light'}
                      >
                        +{meta.reward_unicoins}Ʉ
                      </Badge>
                    </Group>
                    <Progress
                      value={meta.value}
                      color={meta.completed ? 'teal' : 'yellow'}
                      size="sm"
                      radius="xl"
                      striped
                      animated
                      mb={2}
                    />
                    <Group justify="center" mt={4}>
                      {meta.completed && !meta.claimed ? (
                        <Button
                          size="xs"
                          color="yellow"
                          leftSection={<IconGift size={16} />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClaimGoal(meta)
                          }}
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Reclamar
                        </Button>
                      ) : meta.claimed ? (
                        <Button
                          size="xs"
                          color="teal"
                          leftSection={<IconCheck size={16} />}
                          disabled
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Entregado
                        </Button>
                      ) : null}
                    </Group>
                    <Text size="xs" ta="center" c={meta.completed ? 'teal' : '#ffd700'}>
                      {meta.completed
                        ? meta.claimed
                          ? '¡Meta alcanzada y recompensa entregada!'
                          : '¡Meta alcanzada! Reclama tu recompensa'
                        : `Te faltan ${meta.goal - referrals > 0 ? meta.goal - referrals : 0} referidos`}
                    </Text>
                  </Box>
                ))}
              </Stack>
              <Text size="xs" ta="center" style={{ color: '#ffd700', marginTop: 8 }}>
                ¡Invita a tus amigos y gana UniCoins por cada meta alcanzada!
              </Text>
            </Box>
            {/* Rachas */}
            <Box>
              <div className="streak-section-title">
                <IconTrophy size={20} color="#3bd289" />
                <span>Rachas</span>
              </div>
              <Stack gap={6}>
                {streakTotalProgress.length === 0 &&
                  streakPassengerProgress.length === 0 &&
                  streakDriverProgress.length === 0 && (
                    <Text size="sm" c="dimmed">
                      Aún no tienes rachas activas.
                    </Text>
                  )}
                {streakTotalProgress.map((meta) => (
                  <Box
                    key={meta.id}
                    className="streak-line"
                    onClick={() => setMetaModal({ meta, type: 'streak_total' })}
                  >
                    <Text className="streak-name">{meta.name}</Text>
                    <Text className="streak-progress-label">
                      {meta.userProgress}/{meta.goal} ·
                      <span style={{ color: '#ffd700', fontWeight: 700, marginLeft: 4 }}>
                        +{meta.reward_unicoins}Ʉ
                      </span>
                    </Text>
                    <Progress
                      value={meta.value}
                      color={meta.completed ? 'teal' : 'yellow'}
                      size="md"
                      radius="xl"
                      striped
                      animated
                      mt={4}
                      mb={2}
                    />
                    <Group justify="center" mt={4}>
                      {meta.completed && !meta.claimed ? (
                        <Button
                          size="xs"
                          color="yellow"
                          leftSection={<IconGift size={16} />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClaimGoal(meta)
                          }}
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Reclamar
                        </Button>
                      ) : meta.claimed ? (
                        <Button
                          size="xs"
                          color="teal"
                          leftSection={<IconCheck size={16} />}
                          disabled
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Entregado
                        </Button>
                      ) : null}
                    </Group>
                    <Text size="xs" ta="center" c={meta.completed ? 'teal' : '#ffd700'}>
                      {meta.completed
                        ? meta.claimed
                          ? '¡Objetivo logrado y recompensa entregada!'
                          : '¡Objetivo logrado! Reclama tu recompensa'
                        : `Te faltan ${meta.goal - meta.userProgress > 0 ? meta.goal - meta.userProgress : 0} viajes`}
                    </Text>
                  </Box>
                ))}
                {streakPassengerProgress.map((meta) => (
                  <Box
                    key={meta.id}
                    className="streak-line"
                    onClick={() => setMetaModal({ meta, type: 'streak_passenger' })}
                  >
                    <Text className="streak-name">{meta.name}</Text>
                    <Text className="streak-progress-label">
                      {meta.userProgress}/{meta.goal} ·
                      <span style={{ color: '#ffd700', fontWeight: 700, marginLeft: 4 }}>
                        +{meta.reward_unicoins}Ʉ
                      </span>
                    </Text>
                    <Progress
                      value={meta.value}
                      color={meta.completed ? 'teal' : 'yellow'}
                      size="md"
                      radius="xl"
                      striped
                      animated
                      mt={4}
                      mb={2}
                    />
                    <Group justify="center" mt={4}>
                      {meta.completed && !meta.claimed ? (
                        <Button
                          size="xs"
                          color="yellow"
                          leftSection={<IconGift size={16} />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClaimGoal(meta)
                          }}
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Reclamar
                        </Button>
                      ) : meta.claimed ? (
                        <Button
                          size="xs"
                          color="teal"
                          leftSection={<IconCheck size={16} />}
                          disabled
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Entregado
                        </Button>
                      ) : null}
                    </Group>
                    <Text size="xs" ta="center" c={meta.completed ? 'teal' : '#ffd700'}>
                      {meta.completed
                        ? meta.claimed
                          ? '¡Objetivo logrado y recompensa entregada!'
                          : '¡Objetivo logrado! Reclama tu recompensa'
                        : `Te faltan ${meta.goal - meta.userProgress > 0 ? meta.goal - meta.userProgress : 0} viajes como pasajero`}
                    </Text>
                  </Box>
                ))}
                {streakDriverProgress.map((meta) => (
                  <Box
                    key={meta.id}
                    className="streak-line"
                    onClick={() => setMetaModal({ meta, type: 'streak_driver' })}
                  >
                    <Text className="streak-name">{meta.name}</Text>
                    <Text className="streak-progress-label">
                      {meta.userProgress}/{meta.goal} ·
                      <span style={{ color: '#ffd700', fontWeight: 700, marginLeft: 4 }}>
                        +{meta.reward_unicoins}Ʉ
                      </span>
                    </Text>
                    <Progress
                      value={meta.value}
                      color={meta.completed ? 'teal' : 'yellow'}
                      size="md"
                      radius="xl"
                      striped
                      animated
                      mt={4}
                      mb={2}
                    />
                    <Group justify="center" mt={4}>
                      {meta.completed && !meta.claimed ? (
                        <Button
                          size="xs"
                          color="yellow"
                          leftSection={<IconGift size={16} />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClaimGoal(meta)
                          }}
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Reclamar
                        </Button>
                      ) : meta.claimed ? (
                        <Button
                          size="xs"
                          color="teal"
                          leftSection={<IconCheck size={16} />}
                          disabled
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Entregado
                        </Button>
                      ) : null}
                    </Group>
                    <Text size="xs" ta="center" c={meta.completed ? 'teal' : '#ffd700'}>
                      {meta.completed
                        ? meta.claimed
                          ? '¡Objetivo logrado y recompensa entregada!'
                          : '¡Objetivo logrado! Reclama tu recompensa'
                        : `Te faltan ${meta.goal - meta.userProgress > 0 ? meta.goal - meta.userProgress : 0} viajes como conductor`}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Box>
          </div>
        </div>
        {/* Modal de meta */}
        <MetaModal />
        {/* Card de canje de UniCoins */}
        <Card
          className="card-coin-redeem"
          withBorder
          radius="md"
          shadow="lg"
          onClick={() => navigate({ to: '/change' })}
          style={{
            cursor: 'pointer',
            background: 'linear-gradient(120deg, #38bdf8 60%, #a259ff 100%)',
            color: '#fff',
            transition: 'transform 0.18s, box-shadow 0.18s',
            boxShadow: '0 8px 28px #a259ff33',
            marginBottom: 8,
            maxWidth: 420,
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Group gap={12} align="center" mb={4}>
            <IconExchange size={32} color="#fff" style={{ background: '#0a7557', borderRadius: '50%', padding: 6 }} />
            <Title order={4} style={{ color: '#fff', fontWeight: 900, letterSpacing: 1 }}>
              Canjea tus UniCoins
            </Title>
          </Group>
          <Text size="md" style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>
            Cambia tus UniCoins por premios, regalos y más.
          </Text>
          <Text size="sm" style={{ color: '#0a7557', background: '#fff', borderRadius: 8, padding: '4px 12px', display: 'inline-block', fontWeight: 700 }}>
            ¡Explora el catálogo y solicita tu canje!
          </Text>
          <div
            style={{
              position: 'absolute',
              right: 18,
              bottom: 18,
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px #3bd28933',
            }}
          >
            <IconGift size={28} color="#ffd700" />
          </div>
        </Card>
      </Stack>
    </Container>
  )
}

export const Route = createFileRoute('/account/')({
  component: AccountView,
})