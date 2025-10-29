-- CORREÇÃO FORÇADA - REMOVER TRIGGERS DUPLICADOS DO MÓDULO FINANCEIRO
-- Os triggers anteriores não foram removidos, forçando remoção agora

-- Remover triggers duplicados em financial_entries
DROP TRIGGER audit_financial_entries_changes ON financial_entries CASCADE;
DROP TRIGGER trg_validate_financial_entries ON financial_entries CASCADE;
DROP TRIGGER trigger_financial_entries_updated_at ON financial_entries CASCADE;