# Entregas para clientes (vídeos e fotos)

Sistema de entrega da IB Films, trazido do site de casamentos (izaldobacelarfilms.com.br) e adaptado para empresas e eventos. Os dois funcionam separados: cada site tem o próprio painel, a própria senha e o próprio bucket no Cloudflare R2.

- **Cliente:** abre direto pelo link `izaldobacelar.com/entrega/<projeto>-<código>`, sem senha. O código aleatório no fim impede que alguém chegue à entrega só sabendo o nome do projeto. Se um link vazar, use **Trocar link** no admin.
- **Você:** `izaldobacelar.com/admin` (senha do admin). Lá você cria a entrega, envia vídeos, fotos e downloads extras, lê os recados do cliente e copia a mensagem pronta para mandar por WhatsApp ou e-mail.

Os arquivos ficam no Cloudflare R2. O site só gera links temporários (12 h), então os vídeos não passam pela Vercel e não pesam no plano.

## Configuração (uma vez)

### 1. Bucket novo no Cloudflare R2

1. Em https://dash.cloudflare.com, abra **R2 → Create bucket** com o nome `ib-films-produtora` (ou outro). Deixe privado.
2. No bucket: **Settings → CORS Policy → Add CORS policy** e cole:

   ```json
   [
     {
       "AllowedOrigins": ["https://www.izaldobacelar.com", "https://izaldobacelar.com", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Sem o `ExposeHeaders: ETag`, o envio de vídeos grandes falha.
3. **R2 → Manage R2 API Tokens → Create API token** com permissão **Object Read & Write** só nesse bucket novo. Guarde o *Access Key ID* e o *Secret Access Key*. O *Account ID* é o mesmo da conta (aparece na página inicial do R2).

### 2. Variáveis de ambiente na Vercel

No projeto **deste** site na Vercel: **Settings → Environment Variables** (ambiente Production). Para testar no computador, coloque as mesmas num arquivo `.env.local` dentro da pasta `site`:

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...            (do token novo)
R2_SECRET_ACCESS_KEY=...        (do token novo)
R2_BUCKET=ib-films-produtora
ADMIN_PASSWORD=uma-senha-forte-so-sua
SESSION_SECRET=um-texto-aleatorio-longo
```

Use uma senha de admin diferente da do site de casamentos. Para gerar o `SESSION_SECRET`, rode `openssl rand -hex 32` no terminal. Depois de salvar as variáveis, faça um novo deploy.

Enquanto as variáveis não existem, `/admin` mostra "Configuração pendente" e o resto do site funciona normalmente.

## Dicas de uso

- **Nome da entrega:** use "Cliente — Projeto" (ex.: `Azov Yachts — Lançamento 2026`). O link é gerado a partir dele.
- **Vídeos:** MP4 (H.264), que toca em qualquer navegador. O nome do arquivo vira o título, que pode ser trocado no admin. Arquivos grandes sobem em partes, então mantenha a página aberta até terminar. Até 50 GB por arquivo.
- **Fotos:** JPG em alta, organizadas por álbum (ex.: Evento e Bastidores). As miniaturas são geradas no seu navegador durante o envio. Até 100 MB por foto.
- **Arquivo com o mesmo nome:** o admin avisa antes e você escolhe pular, substituir ou enviar com outro nome.
- **Recados:** no fim da entrega, o cliente deixa um recado ou pede um ajuste. Os recados aparecem na seção **Feedback** da entrega no admin, com "Novo" até você marcar como lidos, e as entregas com recado novo aparecem em "Precisa de atenção" no painel inicial.
- **Busca por rosto:** não veio para este site.

## Custos de referência (R2)

Armazenamento a US$ 0,015/GB/mês, com 10 GB grátis por conta (somados os dois buckets). Download pelo cliente é grátis.

## Privacidade

A página `/privacidade` descreve o que o site faz hoje (contato, entregas, recados e cookies) e é um **rascunho para revisão de um advogado**. As entregas ficam no ar por 1 ano (`PRAZO_ENTREGA` em `src/lib/empresa.ts`). Se o site ganhar analytics, pixel ou outro serviço, atualize a página junto.

Quando um cliente pedir para apagar os dados, **Excluir entrega** no admin apaga todos os arquivos e recados dela no R2.
