-- Terminal Cash Log — immutable ledger of cash-flow events per shift/terminal

CREATE TABLE terminal_cash_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL,

  event_type VARCHAR(50) NOT NULL,

  credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  debit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_after DECIMAL(10,2) NOT NULL,

  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  recorded_by UUID NOT NULL REFERENCES users(id),
  authorized_by UUID REFERENCES users(id),

  reason TEXT,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_log_shift ON terminal_cash_log(shift_id, created_at);
CREATE INDEX idx_cash_log_terminal ON terminal_cash_log(terminal_id, created_at);
