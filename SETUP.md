# Scooto Compliance — Setup

## Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente (ou Supabase/Neon para produção)

## 1. Configurar variáveis de ambiente

Edite o arquivo `.env`:
```
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/scooto_compliance?schema=public"
NEXTAUTH_SECRET="gere com: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

## 2. Criar o banco de dados
```bash
# No PostgreSQL
createdb scooto_compliance
```

## 3. Criar as tabelas e popular usuário admin
```bash
npx prisma db push
npx prisma db seed
```

Isso cria o usuário padrão:
- **E-mail:** duda@scooto.com.br  
- **Senha:** scooto2024

⚠️ Troque a senha após o primeiro acesso!

## 4. Rodar o projeto
```bash
npm run dev
```

Acesse: http://localhost:3000

## Deploy na Vercel

1. Crie um banco PostgreSQL (Neon ou Supabase — plano gratuito)
2. Configure as variáveis de ambiente no painel da Vercel
3. `NEXTAUTH_URL` deve ser a URL pública do deploy
4. `npx prisma db push` após configurar o banco de produção
