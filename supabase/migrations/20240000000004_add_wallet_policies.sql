
-- Habilitar RLS para las tablas
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para wallets
CREATE POLICY "Users can view their own wallet"
ON wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
ON wallets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para wallet_transactions
CREATE POLICY "Users can view their own wallet transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (
    wallet_id IN (
        SELECT id FROM wallets 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert wallet transactions"
ON wallet_transactions FOR INSERT
TO authenticated
WITH CHECK (
    wallet_id IN (
        SELECT id FROM wallets 
        WHERE user_id = auth.uid()
    )
);

-- Trigger para actualizar balance de wallet cuando se aprueba una transacción
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
        UPDATE wallets
        SET balance = balance + 
            CASE 
                WHEN NEW.transaction_type = 'CREDIT' THEN NEW.amount
                ELSE -NEW.amount
            END
        WHERE id = NEW.wallet_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER wallet_transaction_status_change
    AFTER UPDATE ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance_on_transaction();

-- Establecer valores por defecto
ALTER TABLE wallets 
ALTER COLUMN balance SET DEFAULT 0,
ALTER COLUMN frozen_balance SET DEFAULT 0;

ALTER TABLE wallet_transactions
ALTER COLUMN status SET DEFAULT 'PENDING',
ALTER COLUMN transaction_date SET DEFAULT CURRENT_TIMESTAMP;
