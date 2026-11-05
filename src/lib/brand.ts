/**
 * Identidade em um único lugar. Todo texto de marca visível (telas, PDFs,
 * manifest) deve ler daqui, para o nome nunca divergir entre README, UI e
 * documentos entregues ao cliente.
 *
 * As chaves internas de armazenamento (`safip-*`) continuam como estão de
 * propósito: não aparecem para o usuário e renomeá-las apagaria os dados
 * locais já salvos no navegador.
 */
export const BRAND = {
  empresa: 'Rajamine',
  razaoSocial: 'Rajamine Inteligência em Mineração',
  produto: 'FieldOps',
  nomeCompleto: 'Rajamine FieldOps',
  descritor: 'Relatórios de campo',
  /** Domínio dos e-mails fictícios do ambiente demonstrativo. */
  dominioDemo: 'rajamine.demo',
  cor: { grafite: '#18181B', amarelo: '#FFC400' },
} as const;
