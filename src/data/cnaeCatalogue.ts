export interface CNAEItem {
  code: string;
  description: string;
  sector: string;
  searchKeywords: string;
}

export const CNAE_CATALOGUE: CNAEItem[] = [
  {
    code: '49.30-2-02',
    description: 'Transporte rodoviário de carga intermunicipal e interestadual',
    sector: 'Logística & Transporte',
    searchKeywords: 'Transportadora logística transporte de cargas',
  },
  {
    code: '49.30-2-01',
    description: 'Transporte rodoviário de carga municipal',
    sector: 'Logística & Transporte',
    searchKeywords: 'Transportadora express entregas logística urbana',
  },
  {
    code: '46.39-7-01',
    description: 'Comércio atacadista de produtos alimentícios em geral',
    sector: 'Alimentos & Bebidas',
    searchKeywords: 'Distribuidora de alimentos atacado alimentício',
  },
  {
    code: '46.46-0-01',
    description: 'Comércio atacadista de cosméticos e produtos de perfumaria',
    sector: 'Cosméticos & Beleza',
    searchKeywords: 'Distribuidora de cosméticos perfumaria atacado',
  },
  {
    code: '46.79-6-01',
    description: 'Comércio atacadista de tintas, vernizes e similares',
    sector: 'Construção & Tintas',
    searchKeywords: 'Distribuidora de tintas vernizes materiais pintura',
  },
  {
    code: '62.01-5-01',
    description: 'Desenvolvimento de programas de computador sob encomenda',
    sector: 'Tecnologia & Software',
    searchKeywords: 'Empresa de software desenvolvimento de sistemas tecnologia',
  },
  {
    code: '62.02-3-00',
    description: 'Desenvolvimento e licenciamento de softwares customizáveis',
    sector: 'Tecnologia & Software',
    searchKeywords: 'Software house plataforma saas tecnologia da informação',
  },
  {
    code: '70.20-4-00',
    description: 'Atividades de consultoria em gestão empresarial',
    sector: 'Serviços Corporativos',
    searchKeywords: 'Consultoria empresarial gestão empresarial b2b consultores',
  },
  {
    code: '86.10-1-01',
    description: 'Atividades de atendimento hospitalar',
    sector: 'Saúde & Medicina',
    searchKeywords: 'Hospital clínica médica centro médico hospitalar',
  },
  {
    code: '86.30-5-01',
    description: 'Atividade médica ambulatorial com recursos para procedimentos',
    sector: 'Saúde & Medicina',
    searchKeywords: 'Clínica de especialidades médicas policlínica consultas',
  },
  {
    code: '41.20-4-00',
    description: 'Construção de edifícios e obras de engenharia civil',
    sector: 'Construção Civil',
    searchKeywords: 'Construtora engenharia civil obras empreendimentos',
  },
  {
    code: '25.11-0-00',
    description: 'Fabricação de estruturas metálicas e caldeiraria',
    sector: 'Indústria Metalúrgica',
    searchKeywords: 'Indústria metalúrgica estruturas metálicas caldeiraria',
  },
  {
    code: '10.91-1-02',
    description: 'Fabricação de produtos de panificação e confeitaria',
    sector: 'Alimentos & Bebidas',
    searchKeywords: 'Indústria de panificação fábrica de pães confeitaria atacado',
  },
  {
    code: '47.11-3-02',
    description: 'Comércio varejista de mercadorias em geral (Supermercados)',
    sector: 'Varejo Alimentício',
    searchKeywords: 'Supermercado rede de supermercados atacarejo hipermercado',
  },
  {
    code: '45.20-0-01',
    description: 'Serviços de manutenção e reparação mecânica automotiva',
    sector: 'Automotivo',
    searchKeywords: 'Oficina mecânica centro automotivo manutenção frotas',
  },
  {
    code: '69.20-6-01',
    description: 'Atividades de contabilidade, auditoria e consultoria tributária',
    sector: 'Serviços Corporativos',
    searchKeywords: 'Escritório de contabilidade assessoria contábil tributária',
  },
  {
    code: '71.12-0-00',
    description: 'Serviços de engenharia e projetos técnicos',
    sector: 'Engenharia & Projetos',
    searchKeywords: 'Empresa de engenharia projetos industriais laudos perícias',
  },
  {
    code: '21.21-1-01',
    description: 'Fabricação de medicamentos para uso humano',
    sector: 'Farmacêutico',
    searchKeywords: 'Indústria farmacêutica laboratório farmacêutico medicamentos',
  },
  {
    code: '46.69-9-99',
    description: 'Comércio atacadista de outras máquinas e equipamentos',
    sector: 'Máquinas & Equipamentos',
    searchKeywords: 'Distribuidora de máquinas industriais equipamentos para indústria',
  },
  {
    code: '52.11-7-99',
    description: 'Depósitos de mercadorias para terceiros, exceto armazéns gerais',
    sector: 'Logística & Armazenagem',
    searchKeywords: 'Centro de distribuição armazenagem cross docking operador logístico',
  },
];
