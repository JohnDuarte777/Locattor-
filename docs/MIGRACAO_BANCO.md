# Migração para banco de dados online

Hoje o Locattor guarda contas e dados **no próprio aparelho**. O código já está
organizado para trocar isso por um banco online alterando apenas a camada de
serviços — as telas não precisam mudar.

## Como está organizado

```
src/services/
  types.ts        # contratos: AuthService (login) e DataRepository (dados)
  index.ts        # escolhe qual implementação o app usa  <- único ponto de troca
  local/
    auth.ts       # login local (senha com hash SHA-256 + salt, no aparelho)
    data.ts       # dados no AsyncStorage, separados por usuário
src/auth/AuthProvider.tsx   # estado de login usado pelas telas
src/data/store.tsx          # estado dos dados; salva via DataRepository
src/data/diff.ts            # calcula o que mudou (inserir/alterar/excluir)
docs/supabase/schema.sql    # tabelas, índices e regras de acesso (RLS)
```

- **AuthService**: `getCurrentUser`, `signIn`, `signUp`, `signOut`, `requestPasswordReset`.
- **DataRepository**: `load(userId)` devolve todos os dados do usuário;
  `save(userId, data, changes)` recebe o estado completo **e** a lista de
  alterações (`upsert`/`delete` por registro), já em ordem segura para
  chaves estrangeiras. Um banco online deve usar `changes`.
- Os IDs são **UUID v4**, compatíveis com a coluna `uuid` do PostgreSQL.

## Passo a passo (Supabase — recomendado)

1. Crie um projeto em <https://supabase.com> e rode `docs/supabase/schema.sql`
   no **SQL Editor**.
2. Instale as dependências:
   ```bash
   npx expo install @supabase/supabase-js expo-secure-store react-native-url-polyfill
   ```
3. Crie `.env` com as chaves do projeto (Settings → API):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Implemente `src/services/supabase/auth.ts` (`AuthService`) usando
   `supabase.auth.signInWithPassword`, `signUp` (com `options.data.name`),
   `signOut`, `resetPasswordForEmail` e `getSession`, guardando a sessão no
   `expo-secure-store`.
5. Implemente `src/services/supabase/data.ts` (`DataRepository`):
   - `load`: `select` nas 5 tabelas e conversão snake_case → camelCase;
   - `save`: percorrer `changes` fazendo `upsert` / `delete` na tabela
     correspondente (camelCase → snake_case). O `user_id` é preenchido pelo
     próprio banco (`default auth.uid()`).
6. Em `src/services/index.ts`, troque `localAuth`/`localDataRepository` pelas
   novas implementações.
7. (Opcional) Ofereça uma importação única dos dados locais: ler com
   `localDataRepository.load(idLocal)` e enviar tudo com `upsert`.

### Mapeamento de campos

| App (camelCase) | Banco (snake_case) |
| --------------- | ------------------ |
| `propertyId`    | `property_id`      |
| `tenantId`      | `tenant_id`        |
| `contractId`    | `contract_id`      |
| `dueDay`        | `due_day`          |
| `startDate` / `endDate` | `start_date` / `end_date` |
| `dueDate` / `paidAt`    | `due_date` / `paid_at`    |
| `createdAt`     | `created_at`       |

Campos opcionais ausentes no app (`undefined`) devem ser enviados como `null`.

## Limitações do modo local (atual)

- As contas existem só no aparelho em que foram criadas.
- Não há recuperação de senha por e-mail (a tela já existe e passa a funcionar
  com o banco online).
- Desinstalar o app apaga contas e dados.
