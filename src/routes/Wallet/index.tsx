import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Tabs,
} from '@mantine/core';
import { DollarSign, Lock } from 'lucide-react';
import { getCurrentWallet, getWalletTransactions } from '@/services/wallet';
import styles from './index.module.css';

interface WalletData {
  id: number;
  balance: number;
  frozen_balance: number;
}

interface WalletTransaction {
  id: number;
  amount: number;
  detail: string | null;
  transaction_date: string | null;
  transaction_type: string;
}

import BackButton from '@/components/Buttons/backButton';

const WalletDetailView: React.FC = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData>({ id: 0, balance: 0, frozen_balance: 0 });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<string>('transactions');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        // Usar el backend service para obtener datos de la wallet
        const walletResponse = await getCurrentWallet();
        console.log('💰 Wallet response:', walletResponse);
        
        if (!walletResponse.success) {
          if (walletResponse.error?.includes('auth') || walletResponse.error?.includes('token') || walletResponse.error?.includes('401')) {
            navigate({ to: '/Login' });
            return;
          }
          throw new Error(walletResponse.error || 'Error al obtener wallet');
        }

        if (!walletResponse.data) {
          throw new Error('No se recibieron datos de la wallet');
        }

        const wallet = walletResponse.data;
        console.log('💰 Wallet data:', wallet);
        setWalletData({
          id: Number(wallet.id) || 0,
          balance: Number(wallet.balance) || 0,
          frozen_balance: Number(wallet.frozen_balance) || 0,
        });

        // Obtener transacciones usando el backend service
        const transactionsResponse = await getWalletTransactions();
        console.log('💳 Transactions response:', transactionsResponse);
        
        if (transactionsResponse.success && transactionsResponse.data) {
          // Mapear las transacciones del servicio al formato local
          const mappedTransactions: WalletTransaction[] = transactionsResponse.data.map(tx => ({
            id: Number(tx.id),
            amount: Number(tx.amount),
            detail: tx.detail || 'Sin descripción',
            transaction_date: tx.created_at,
            transaction_type: tx.transaction_type,
          }));
          
          setTransactions(mappedTransactions);
        } else {
          console.log('💳 No transactions found or error:', transactionsResponse.error);
          setTransactions([]);
        }
      } catch (err: any) {
        console.error('❌ Error fetching wallet data:', err);
        setError(`Error al cargar información de la billetera: ${err.message}`);
      }
    };

    fetchWalletData();
  }, [navigate]);

  const isPositive = (type: string) => {
    return type === 'recarga' || type === 'devolución' || type === 'cupon';
  };

  return (
    <Container fluid className={styles.container}>
      <div className={styles.walletHeader}>
        <BackButton to='/perfil' />
        <Title className={styles.walletTitle}>Detalle de Billetera</Title>
      </div>

      <Card shadow="sm" className={styles.balanceCard}>
        <Group gap="xl" className={styles.balanceGroup}>
          <div className={styles.balanceSection}>
            <Group gap="xs">
              <DollarSign size={24} />
              <Title order={3}>Saldo Disponible</Title>
            </Group>
            <p className={styles.balanceAmount}>
              ${walletData.balance.toLocaleString()}
            </p>
          </div>
          <div className={styles.balanceSection}>
            <Group gap="xs">
              <Lock size={24} />
              <Title order={3}>Saldo Congelado</Title>
            </Group>
            <p className={styles.frozenAmount}>
              ${walletData.frozen_balance.toLocaleString()}
            </p>
          </div>
        </Group>
      </Card>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'transactions')}>
        <Tabs.List>
          <Tabs.Tab value="transactions">Transacciones</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="transactions">
          <div className={styles.transactionsSection}>
            <Title order={4} className={styles.sectionTitle}>
              Transacciones de Wallet
            </Title>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <Card key={transaction.id} className={styles.transactionCard}>
                  <Group gap="apart">
                    <div>
                      <Text fw={500}>{transaction.detail || 'Sin descripción'}</Text>
                      <Text size="sm" color="dimmed">
                        {new Date(transaction.transaction_date || '').toLocaleDateString()}
                      </Text>
                    </div>
                    <Badge
                      size="lg"
                      variant="filled"
                      className={
                        isPositive(transaction.transaction_type)
                          ? styles.creditTransaction
                          : styles.debitTransaction
                      }
                    >
                      {isPositive(transaction.transaction_type) ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </Badge>
                  </Group>
                </Card>
              ))
            ) : (
              <Text color="dimmed" className={styles.noTransactionsText}>
                No hay transacciones registradas
              </Text>
            )}
          </div>
        </Tabs.Panel>
      </Tabs>

      {error && <Text color="red" className={styles.errorMessage}>{error}</Text>}
    </Container>
  );
};

export const Route = createFileRoute('/Wallet/')({
  component: WalletDetailView,
});

export default WalletDetailView;
