// Política de Privacidade do site da IB Films, no mesmo padrão da do site de casamentos (LGPD, arts. 7º,
// 9º, 18, 19, 33, 41 e 48, e os guias da ANPD). Vale a leitura final de um advogado.
// O texto descreve o que o código faz hoje; se o site mudar (novo serviço, analytics), esta página muda junto.
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { EMPRESA, PRAZO_ENTREGA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  alternates: { canonical: "/privacidade" },
};

const UPDATED = "17 de novembro de 2026";

// Fornecedores que tratam dados em nosso nome (operadores)
const OPERATORS = [
  { name: "Vercel", use: "hospeda o site", data: "dados técnicos de acesso, como IP e páginas visitadas" },
  { name: "Prismic", use: "entrega os textos, fotos e vídeos do portfólio", data: "IP de quem visita" },
  {
    name: "Cloudflare (R2)",
    use: "guarda as entregas dos clientes",
    data: "vídeos, fotos, nome do cliente ou do projeto, data, fotos favoritas e recados deixados na entrega",
  },
];

// Serviços que também tratam os dados segundo as próprias políticas
const CONTROLLERS = [
  {
    name: "Meta (WhatsApp)",
    use: "conversa sobre propostas, atendimento e envio do link de entrega",
    data: "o que você escreve na mensagem",
    policy: "https://www.whatsapp.com/legal/privacy-policy",
  },
];

// Cookies e armazenamento no navegador, como pede o guia de cookies da ANPD
const COOKIES = [
  {
    name: "ib_admin (cookie)",
    use: "mantém o login do painel administrativo; só é criado para a equipe da IB Films",
    duration: "7 dias",
    kind: "necessário",
  },
  {
    name: "zip-sw.js (service worker)",
    use: "monta o arquivo .zip dos downloads na página de entrega; não coleta dados",
    duration: "até você apagar os dados do site",
    kind: "necessário",
  },
  {
    name: "ibfilms:recado-nome (armazenamento local)",
    use: "lembra, neste aparelho, o nome que você usou no último recado da entrega",
    duration: "até você apagar os dados do site",
    kind: "funcional",
  },
];

const RIGHTS = [
  "confirmação de que tratamos dados seus",
  "acesso aos dados",
  "correção de dados incompletos, inexatos ou desatualizados",
  "anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei",
  "portabilidade dos dados a outro fornecedor",
  "eliminação dos dados tratados com o seu consentimento",
  "informação sobre com quem compartilhamos seus dados",
  "informação sobre a possibilidade de não dar consentimento e as consequências disso",
  "revogação do consentimento",
  "oposição a tratamento feito com base em outra hipótese legal, se houver descumprimento da lei",
];

const linkClass = "font-medium text-paper underline underline-offset-4 hover:text-accent";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-lg leading-8 text-paper/75">{children}</div>
    </section>
  );
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-line bg-[#0c1d28] px-5 py-4 text-base leading-7">
      <strong className="text-paper">{title}</strong>: {children}
    </li>
  );
}

export default function PrivacidadePage() {
  const legal = [EMPRESA.documento, EMPRESA.endereco].filter(Boolean).join(", ");
  const contact = (
    <a href={`mailto:${EMPRESA.email}`} className={linkClass}>
      {EMPRESA.email}
    </a>
  );

  return (
    <>
      <Nav />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 pb-20 pt-32 md:px-10 md:pt-40">
          <p className="text-sm uppercase tracking-[0.2em] text-mist">IB Films</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Política de Privacidade</h1>
          <p className="mt-4 text-mist">Última atualização: {UPDATED}</p>

          <Section title="1. Quem cuida dos seus dados">
            <p>
              O controlador dos dados tratados neste site é a {EMPRESA.nome}, de {EMPRESA.razaoSocial}
              {legal && ` (${legal})`}.
            </p>
            <p>
              <strong className="text-paper">Canal de atendimento ao titular:</strong> {contact}, atendido por
              Izaldo Bacelar. Como agente de tratamento de pequeno porte, não indicamos encarregado (DPO); este canal
              recebe pedidos, dúvidas e reclamações sobre dados pessoais (LGPD, art. 41, e Resolução CD/ANPD nº
              2/2022).
            </p>
          </Section>

          <Section title="2. Quais dados usamos, para quê e com qual base legal">
            <p>
              <strong className="text-paper">Contato e proposta.</strong> O formulário de contato pede nome,
              e-mail e uma mensagem e, se você quiser, empresa e WhatsApp. Ele não grava nada no nosso site: ao
              enviar, o WhatsApp abre com a mensagem pronta, e ela só é enviada se você confirmar no aplicativo.
              Usamos esses dados para responder e preparar a proposta. Base legal: procedimentos preliminares a um
              contrato, a seu pedido (LGPD, art. 7º, V).
            </p>
            <p>
              <strong className="text-paper">Entrega do projeto.</strong> Para entregar o trabalho contratado,
              guardamos os vídeos e as fotos do projeto (que podem mostrar colaboradores, convidados ou público do
              evento), o nome do cliente ou do projeto, a data da gravação, os títulos dos vídeos e as fotos
              marcadas como favoritas. Cada entrega abre por um link com um código aleatório, enviado ao cliente.
              Quem recebe o link pode ver e baixar o material, por isso pedimos que ele seja compartilhado só com
              quem precisa. Base legal: execução do contrato (LGPD, art. 7º, V).
            </p>
            <p>
              <strong className="text-paper">Recados na entrega.</strong> No fim da página de entrega, o cliente
              pode deixar um recado sobre o material. Guardamos a mensagem, o nome (se a pessoa quiser informar) e
              a data, e só a equipe da IB Films lê. O recado é apagado quando o excluímos ou quando a entrega é
              excluída. Base legal: execução do contrato (LGPD, art. 7º, V), para atender pedidos de ajuste, e
              legítimo interesse em saber a opinião sobre o trabalho (LGPD, art. 7º, IX).
            </p>
            <p>
              <strong className="text-paper">Portfólio.</strong> Exibimos neste site e nas nossas redes trechos de
              trabalhos que produzimos, conforme a autorização de uso de imagem prevista no contrato com cada cliente
              (LGPD, art. 7º, I e IX). Se você aparece em algum vídeo ou foto e não quer, fale com a gente pelo canal
              acima e retiramos.
            </p>
            <p>
              <strong className="text-paper">Navegação.</strong> Nosso provedor de hospedagem registra dados
              técnicos de cada acesso, como endereço IP, data, hora e página visitada, para manter o site funcionando
              e seguro. Base legal: legítimo interesse (LGPD, art. 7º, IX) e, quando aplicável, cumprimento de
              obrigação legal (Marco Civil da Internet, art. 15).
            </p>
            <p>Não tomamos decisões automatizadas sobre você e não usamos seus dados para publicidade.</p>
          </Section>

          <Section title="3. Com quem compartilhamos">
            <p>Estes fornecedores tratam dados em nosso nome, só para o site funcionar:</p>
            <ul className="space-y-3">
              {OPERATORS.map((p) => (
                <Item key={p.name} title={p.name}>
                  {p.use}. Recebe {p.data}.
                </Item>
              ))}
            </ul>
            <p>Este serviço também trata os dados segundo a própria política de privacidade:</p>
            <ul className="space-y-3">
              {CONTROLLERS.map((p) => (
                <Item key={p.name} title={p.name}>
                  {p.use}. Recebe {p.data}.{" "}
                  <a href={p.policy} className={linkClass}>
                    Política de privacidade
                  </a>
                </Item>
              ))}
            </ul>
            <p>
              Esses fornecedores podem guardar dados fora do Brasil, por exemplo nos Estados Unidos. Essa
              transferência se apoia nas cláusulas de proteção de dados dos contratos de cada fornecedor (LGPD, art.
              33, e Resolução CD/ANPD nº 19/2024). Não vendemos dados pessoais. Também podemos fornecer dados a
              autoridades quando a lei exigir.
            </p>
          </Section>

          <Section title="4. Por quanto tempo guardamos">
            <p>
              As entregas ficam disponíveis por {PRAZO_ENTREGA} depois do envio do link. Depois disso, ou antes, se o
              cliente pedir, excluímos os arquivos do armazenamento. As conversas no WhatsApp ficam enquanto forem
              necessárias para a proposta e o contrato. O portfólio fica publicado enquanto valer a autorização de uso
              de imagem. Os dados de acesso ficam pelo período mantido pelo provedor de hospedagem e pelo exigido em
              lei.
            </p>
          </Section>

          <Section title="5. Seus direitos">
            <p>Você pode pedir, a qualquer momento e sem custo (LGPD, art. 18):</p>
            <ul className="list-disc space-y-1 pl-6">
              {RIGHTS.map((right) => (
                <li key={right}>{right};</li>
              ))}
            </ul>
            <p>
              Para pedir, fale com a gente por {contact}. Podemos pedir uma confirmação de identidade antes de
              atender, para proteger os seus dados. Respondemos em até 15 dias (LGPD, art. 19). Se não ficar
              satisfeito, você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em{" "}
              <a href="https://www.gov.br/anpd" className={linkClass}>
                gov.br/anpd
              </a>
              .
            </p>
          </Section>

          <Section title="6. Cookies e armazenamento no navegador">
            <p>O site não usa cookies de publicidade nem de análise. Esta é a lista completa:</p>
            <ul className="space-y-3">
              {COOKIES.map((c) => (
                <Item key={c.name} title={c.name}>
                  {c.use}. Duração: {c.duration}. Tipo: {c.kind}.
                </Item>
              ))}
            </ul>
            <p>Para apagar tudo, apague os dados deste site nas configurações do seu navegador.</p>
          </Section>

          <Section title="7. Segurança">
            <p>
              As entregas abrem só por links com código aleatório, ficam fora dos buscadores e entregam os arquivos
              por links de download que expiram em até 12 horas. O painel administrativo é protegido por senha e
              todo o site usa conexão criptografada (HTTPS).
            </p>
            <p>
              Se acontecer um incidente de segurança que possa causar risco ou dano relevante, avisamos as pessoas
              afetadas e a ANPD (LGPD, art. 48, e Resolução CD/ANPD nº 15/2024).
            </p>
          </Section>

          <Section title="8. Mudanças nesta política">
            <p>
              Podemos atualizar esta política quando o site mudar. A data no topo mostra a versão em vigor.{" "}
              <Link href="/contato" className={linkClass}>
                Fale com a gente
              </Link>{" "}
              se tiver qualquer dúvida.
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  );
}
