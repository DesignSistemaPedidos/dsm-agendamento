-- SCRIPT: GERAR DESPESAS (FIXAS E VARIÁVEIS)
-- Adiciona despesas para simular o painel financeiro completo.

DO $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_start_of_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    -- 1. DESPESAS FIXAS (Aluguel, Internet, etc.)
    
    -- Aluguel (Dia 05 do mês atual ou hoje se for antes)
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Aluguel', 'Aluguel Salão - Mês Atual', 1500.00, v_start_of_month + 4, 'pix'); -- dia 5

    -- Internet (Dia 10)
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Internet', 'Fibra 600MB', 120.00, v_start_of_month + 9, 'cartao_debito'); -- dia 10

    -- Luz (Dia 15 - simulado data próxima)
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Energia', 'Conta de Luz', 350.50, v_today - 2, 'pix');

    -- Água (Dia 15)
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Água', 'Conta de Água', 85.00, v_today - 2, 'dinheiro');


    -- 2. DESPESAS VARIÁVEIS (Manutenção, Equipamentos)

    -- Reposição de Produtos
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Materiais', 'Shampoo e Condicionador Galão', 240.00, v_start_of_month + 2, 'cartao_credito');

    -- Manutenção Equipamento
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Manutenção', 'Afiação de Lâminas', 60.00, v_today - 5, 'dinheiro');

    -- Compra Equipamento Novo
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Equipamentos', 'Secador Profissional Novo', 450.00, v_today - 1, 'cartao_credito');

    -- Marketing/Software
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Software', 'Mensalidade Sistema Agendamento', 59.90, v_today, 'cartao_credito');

    RAISE NOTICE 'Despesas fictícias (Aluguel, Luz, etc) inseridas com sucesso!';
END $$;
