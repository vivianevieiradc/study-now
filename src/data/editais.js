// Conteúdo global — editais (disciplinas/tópicos) por concurso.
// Fonte única compartilhada entre o app (fallback) e o gerador de SQL de seed.
// Os ids estáveis são derivados deterministicamente do índice em App.jsx / no seed.

export const SEED_DATAPREV = [
  // ===== Módulo I — Conhecimentos Gerais (peso 1 por questão) =====
  { name: "Língua Portuguesa", block: "Gerais", peso: 12, q: 12, topics: [
    { name: "Interpretação e compreensão de texto; coesão, coerência e intertextualidade.", hits: 6 },
    { name: "Classes de palavras e aspectos morfossintáticos (substantivo, adjetivo, verbo, advérbio, conjunções, pronomes).", hits: 4 },
    { name: "Sintaxe: organização das frases, termos e orações; coordenação e subordinação.", hits: 4 },
    { name: "Regência, concordância verbal/nominal e norma culta.", hits: 3 },
    { name: "Semântica: sentido próprio/figurado, sinônimos, parônimos; polissemia e ambiguidade.", hits: 3 },
    { name: "Pontuação e sinais gráficos.", hits: 2 },
    { name: "Ortografia, acentuação gráfica e crase.", hits: 2 },
    { name: "Tipos de discurso, registros e funções da linguagem.", hits: 2 },
  ]},
  { name: "Língua Inglesa", block: "Gerais", peso: 12, q: 12, topics: [
    { name: "Compreensão de textos em língua inglesa (main idea, inferências, referência).", hits: 8 },
    { name: "Itens gramaticais relevantes ao sentido: tempos verbais, modais, voz passiva.", hits: 3 },
    { name: "Vocabulário, sinônimos e conectivos (linkers).", hits: 3 },
  ]},
  { name: "Raciocínio Lógico Matemático", block: "Gerais", peso: 6, q: 6, topics: [
    { name: "Lógica proposicional: proposições, conectivos, equivalências e quantificadores.", hits: 3 },
    { name: "Estrutura lógica de relações e dedução; análise de argumentos.", hits: 2 },
    { name: "Proporcionalidade, porcentagem e juros.", hits: 2 },
    { name: "Problemas de contagem e noções de probabilidade.", hits: 2 },
    { name: "Noções de estatística: média, moda, mediana e desvio padrão.", hits: 1 },
    { name: "Geometria e problemas aritméticos, geométricos e matriciais.", hits: 1 },
  ]},
  { name: "Atualidades", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Tópicos atuais: política, economia, sociedade, tecnologia e energia.", hits: 3 },
    { name: "Desenvolvimento sustentável e ecologia.", hits: 2 },
    { name: "Relações internacionais.", hits: 1 },
  ]},
  { name: "Legislação (Seg. da Informação e Proteção de Dados)", block: "Gerais", peso: 5, q: 5, topics: [
    { name: "Lei nº 13.709/2018 (LGPD) — caps I, II, III, IV, VII, VIII e IX.", hits: 2 },
    { name: "Lei nº 12.527/2011 (Acesso à Informação) — caps I ao V; Dec. 7.724 e 7.845.", hits: 1 },
    { name: "Lei nº 12.737/2012 (Delitos Informáticos) — art. 2º.", hits: 1 },
    { name: "Lei nº 12.965/2014 (Marco Civil da Internet) — caps II e III.", hits: 1 },
  ]},
  // ===== Módulo II — Conhecimentos Específicos (30 questões, peso 2,5 = 75 pts) =====
  // O edital não divide as 30 questões por área; os tópicos abaixo são as áreas do
  // conteúdo programático oficial, com 'hits' = incidência observada na prova FGV 2024.
  { name: "Conhecimentos Específicos", block: "Específicos", peso: 75, q: 30, topics: [
    { name: "Banco de Dados: modelagem e normalização, SQL, PostgreSQL/MySQL/MongoDB, Big Data.", hits: 5 },
    { name: "Arquitetura Tecnológica: ágil, requisitos, OO, SOLID/GRASP, TDD/BDD, UML, APIs/REST, DevSecOps.", hits: 5 },
    { name: "Computação em Nuvem e Virtualização: IaaS/PaaS/SaaS, IaC, Docker/Kubernetes/Harbor, VMware.", hits: 5 },
    { name: "Redes de Computadores: meios e topologias, OSI, IEEE 802.x, TCP/IP e camada de aplicação.", hits: 4 },
    { name: "Segurança da Informação: políticas, criptografia, certificação digital, LGPD, IDS/IPS/SIEM.", hits: 4 },
    { name: "Aplicações: Java EE, arquiteturas (SOA/microserviços/P2P), Spring, Kafka, JVM, servidores.", hits: 3 },
    { name: "Plataforma Básica: arquitetura de computadores e storage (bloco, objeto, NAS, NFS, CIFS).", hits: 2 },
    { name: "Automação: IaC e DevOps/DevSecOps, Ansible/GitLab/Jenkins/Rundeck, contêineres.", hits: 2 },
    { name: "Ferramentas Analytics: ETL, BI, Big Data, Machine Learning e mineração de dados.", hits: 2 },
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
