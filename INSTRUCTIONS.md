# 🚨 CORREÇÃO DE ACESSO ADMIN (ERGÊNCIA)

Se o email `dsmempreedimentosdigitais@gmail.com` ainda não consegue ver nada (tela preta ou erro), é porque o usuário foi criado mas **não está vinculado como Admin** no banco de dados.

Vamos forçar isso manualmente agora:

1.  Copie o código do arquivo `supabase/force_admin.sql`.
2.  Cole no **SQL Editor** do Supabase e clique em **RUN**.

Isso vai procurar o usuário com esse email e **obrigar** o sistema a definir ele como `admin`.

---

# 🚨 CORREÇÃO FINAL DE PERMISSÕES (RLS)

O erro "Application Error" e problemas de **agendamento sem login** (convidados) acontecem por bloqueio do banco de dados.

Para resolver DEFINITIVAMENTE:

1.  Copie o conteúdo do arquivo `supabase/fix_rls_final.sql` (novo script que criei).
2.  Cole no **SQL Editor** do Supabase Dashboard e clique em **RUN**.
3.  **IMPORTANTE:** Se der erro dizendo "Policy already exists", não tem problema. O script tenta limpar políticas antigas antes de criar novas.

Isso vai liberar:
*   ✅ Painel Admin (Visualização de dados)
*   ✅ Agendamento por Convidados (Sem login obrigatório)
*   ✅ Visualização de Barbeiros/Serviços

## Teste Final:
*   Após rodar, recarregue a página `/admin`.
*   Tente fazer um agendamento novo sem estar logado.

