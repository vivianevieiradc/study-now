// Conteúdo global — editais (disciplinas/tópicos) por concurso.
// Fonte única compartilhada entre o app (fallback) e o gerador de SQL de seed.
// Os ids estáveis são derivados deterministicamente do índice em App.jsx / no seed.

export const SEED_DATAPREV = [
  { name: "Língua Portuguesa", block: "Gerais", peso: 10, q: 10, topics: [
    { name: "Compreensão e interpretação de textos de gêneros variados e reconhecimento textuais.", hits: 8 },
    { name: "Domínio da ortografia oficial, acentuação e crase.", hits: 5 },
    { name: "Mecanismos de coesão textual, tempos e modos verbais.", hits: 5 },
    { name: "Estrutura morfossintática do período, concordância e regência verbal/nominal.", hits: 6 },
    { name: "Reescrita de frases e parágrafos, significação e substituição de palavras.", hits: 4 },
  ]},
  { name: "Língua Inglesa", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Compreensão de textos em língua inglesa e itens gramaticais relevantes.", hits: 5 },
  ]},
  { name: "Raciocínio Lógico Matemático", block: "Gerais", peso: 10, q: 10, topics: [
    { name: "Estruturas lógicas, lógica de argumentação (inferências, deduções).", hits: 8 },
    { name: "Lógica sentencial (proposições simples/compostas, tabelas-verdade, equivalências).", hits: 8 },
    { name: "Diagramas lógicos e lógica de primeira ordem.", hits: 6 },
    { name: "Problemas aritméticos, geométricos e matriciais.", hits: 5 },
  ]},
  { name: "Atualidades e IA", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Tópicos de segurança, política, economia, sociedade, tecnologia, ecologia.", hits: 4 },
    { name: "Inteligência Artificial: conceitos, fundamentos, aplicações e aprendizado de máquina.", hits: 6 },
    { name: "Modelos generativos, LLMs, ética, governança e privacidade em IA.", hits: 5 },
  ]},
  { name: "Legislação e Seg. Informação", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Lei nº 12.527/2011 (Acesso à Informação) — caps I ao V; Dec 7.724 e 7.845.", hits: 4 },
    { name: "Lei nº 12.737/2012 (Delitos Informáticos) — art. 2º.", hits: 3 },
    { name: "Lei nº 12.965/2014 (Marco Civil da Internet) — caps II e III.", hits: 3 },
    { name: "Lei nº 13.709/2018 (LGPD) — capítulos I, II, III, IV, VII, VIII e IX.", hits: 5 },
  ]},
  { name: "Redes de Computadores", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Conceitos básicos: meios de transmissão, classificação, topologias, WAN, LAN e Redes Sem Fio.", hits: 7 },
    { name: "Elementos de interconexão (hubs, switches, roteadores), VLANs e Cabeamento estruturado.", hits: 6 },
    { name: "Modelo de referência OSI e padrões IEEE 802.1, 802.3, 802.11 a/b/g/n/ac.", hits: 7 },
    { name: "Arquitetura e pilhas de protocolos TCP/IP: camada de rede, transporte e aplicação.", hits: 8 },
  ]},
  { name: "Banco de Dados", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Arquitetura, estruturas, modelagem de dados e normalização.", hits: 7 },
    { name: "SQL (ANSI), DDL, DML. SGBDs: Oracle 19C, MySQL, PostgreSQL, MongoDB, MS-SQLSERVER.", hits: 8 },
    { name: "Armazenamento, backup, restauração, segurança, monitoração e Big Data.", hits: 5 },
  ]},
  { name: "Arquitetura Tecnológica", block: "Específicos", peso: 10, q: 10, topics: [
    { name: "Ciclo de vida do software, Metodologias Ágeis, Qualidade e Gestão de Configuração.", hits: 8 },
    { name: "Engenharia de requisitos (elicitação, gerenciamento, especificação, validação) e Usabilidade.", hits: 6 },
    { name: "Orientação a objetos, SOLID, GRASP, TDD, BDD, Padrões de projeto, UML.", hits: 9 },
    { name: "Interoperabilidade, APIs, API Gateway, Web Services, padrões XML, JSON, REST, DEVSECOPS.", hits: 8 },
  ]},
  { name: "Computação em Nuvem e Virt.", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Conceitos IaaS, PaaS, SaaS. Nuvens Privada, Pública e Híbrida. Escalabilidade e Alta Disponibilidade.", hits: 7 },
    { name: "Componentes de arquitetura (regiões, zonas). Identidade, privacidade e segurança. IaC.", hits: 6 },
    { name: "Red Hat Clair, Docker, Harbor, Kubernetes, VMware (vCenter, vCloud, NSX, vRealize).", hits: 7 },
  ]},
  { name: "Linguagens e Frameworks", block: "Específicos", peso: 7, q: 7, topics: [
    { name: "Gitlab, HTML5, CSS3, Java, Javascript / React.js, Java EE, Spring Boot, Spring Cloud, Kafka.", hits: 7 },
  ]},
  { name: "Segurança da Informação", block: "Específicos", peso: 8, q: 8, topics: [
    { name: "Políticas e Procedimentos. Normas ISO/IEC 27001 e 27002. Criptografia e Certificação digital.", hits: 8 },
    { name: "Vulnerabilidades, malwares, ataques. Ferramentas: IDS, IPS, SIEM. NIST Framework v1.1.", hits: 8 },
  ]},
  { name: "Plataforma Básica", block: "Específicos", peso: 4, q: 4, topics: [
    { name: "Arquitetura de Computadores (Hardware). Backups. Storages (bloco, objeto, NAS, CIFS, NFS).", hits: 4 },
    { name: "Arquitetura de SO (processamento, memória, sistema de arquivos). Monitoramento.", hits: 4 },
  ]},
  { name: "Automação", block: "Específicos", peso: 4, q: 4, topics: [
    { name: "Infra como código, DevOps, Cloud. Ferramentas: Puppet, Ansible, Gitlab, Jenkins, Rundeck. Contêineres.", hits: 5 },
  ]},
  { name: "Ferramentas Analytics", block: "Específicos", peso: 3, q: 3, topics: [
    { name: "ETL, BI, Big Data, Machine Learning, IA. Mineração de Dados e bancos distribuídos.", hits: 4 },
  ]},
  { name: "Plataforma Baixa", block: "Específicos", peso: 3, q: 3, topics: [
    { name: "Windows, Linux, Unix (instalação e suporte). Serviços: Samba, LDAP, AD, SSH, FTP, NFS. Virtualização.", hits: 3 },
  ]},
  { name: "Aplicações", block: "Específicos", peso: 2, q: 2, topics: [
    { name: "Java EE, Container WEB e EJB, Arquitetura SOA e Microserviços. Servidores: Apache, NGINX, Weblogic, JBoss.", hits: 5 },
  ]},
];

export const SEED_BB = [
  { name: "Tecnologia da Informação", block: "Específicos", peso: 52.5, q: 35, topics: [
    { name: "SQL: DDL, DML, JOINs, subconsultas, normalização e 3FN", hits: 9 },
    { name: "Python: NumPy, Pandas, Scikit-learn e estruturas de dados", hits: 8 },
    { name: "Estruturas de dados: pilhas, filas, árvores binárias, busca e ordenação", hits: 8 },
    { name: "Java/OOP: herança, polimorfismo, interfaces, Kotlin", hits: 7 },
    { name: "TypeScript: tipagem estática, generics, DOM, reduce", hits: 5 },
    { name: "Machine Learning: classificação (K-NN), regressão, matriz de confusão, acurácia", hits: 5 },
    { name: "Data Warehouse e Big Data: esquema estrela, cubo de dados, ETL", hits: 4 },
    { name: "NoSQL: MongoDB, grafos, bancos de documentos e colunar", hits: 4 },
    { name: "DevOps e Cloud: Ansible, Docker, Kubernetes, IaC", hits: 4 },
    { name: "Mobile e linguagens: Swift, Kotlin, iOS (Xcode / Interface Builder)", hits: 3 },
  ]},
  { name: "Probabilidade e Estatística", block: "Específicos", peso: 7.5, q: 5, topics: [
    { name: "Probabilidade: eventos, condicional e Teorema de Bayes", hits: 5 },
    { name: "Estatística descritiva: média, mediana, variância e desvio padrão", hits: 5 },
    { name: "Distribuição normal e análise amostral", hits: 3 },
    { name: "Combinatória: permutação, arranjo e combinação", hits: 2 },
  ]},
  { name: "Conhecimentos Bancários", block: "Específicos", peso: 7.5, q: 5, topics: [
    { name: "Sistema Financeiro Nacional — estrutura, BACEN, COPOM e taxa Selic", hits: 5 },
    { name: "Sigilo bancário (Lei Complementar nº 105/2001)", hits: 5 },
    { name: "PLD/FT — prevenção à lavagem de dinheiro (Carta-Circular 4001/2020)", hits: 4 },
    { name: "Responsabilidade socioambiental das instituições financeiras", hits: 3 },
    { name: "Mercado cambial, juros reais e risco-país", hits: 3 },
  ]},
  { name: "Língua Portuguesa", block: "Básicos", peso: 15, q: 10, topics: [
    { name: "Compreensão e interpretação de textos", hits: 10 },
    { name: "Concordância verbal e nominal", hits: 5 },
    { name: "Coesão textual e referência pronominal", hits: 4 },
    { name: "Emprego da crase e pontuação", hits: 3 },
    { name: "Regência verbal e nominal", hits: 3 },
    { name: "Colocação pronominal (próclise, mesóclise, ênclise)", hits: 2 },
  ]},
  { name: "Matemática", block: "Básicos", peso: 7.5, q: 5, topics: [
    { name: "Problemas matemáticos: porcentagem, proporção e mistura", hits: 4 },
    { name: "Progressão aritmética e geométrica", hits: 3 },
    { name: "Funções e equações do 1º e 2º grau", hits: 3 },
    { name: "Juros simples e compostos", hits: 2 },
  ]},
  { name: "Atualidades do Mercado Financeiro", block: "Básicos", peso: 5, q: 5, topics: [
    { name: "Fintechs, bancos digitais e transformação financeira", hits: 5 },
    { name: "Pix e meios de pagamento instantâneo", hits: 4 },
    { name: "Open Banking / Open Finance", hits: 4 },
    { name: "Funções da moeda e sistema monetário", hits: 3 },
    { name: "Blockchain e ativos digitais", hits: 2 },
  ]},
  { name: "Língua Inglesa", block: "Básicos", peso: 5, q: 5, topics: [
    { name: "Interpretação de texto em inglês — main idea e inferências", hits: 5 },
    { name: "Vocabulário e referência pronominal", hits: 3 },
    { name: "Aspectos gramaticais: tempos verbais, voz passiva, modais", hits: 2 },
  ]},
];

export const EDITAIS = {
  "dataprev-arq": SEED_DATAPREV,
  "bb-at": SEED_BB,
};
