export interface SampleDatasetInfo {
  id: string;
  title: string;
  description: string;
  category: 'graprohab' | 'planejamento' | 'ambiental' | 'tempo-real';
  geometryType: 'Point' | 'Polygon' | 'LineString';
  featureCount: number;
  data: GeoJSON.FeatureCollection;
}

export const SAMPLE_DATASETS: SampleDatasetInfo[] = [
  {
    id: 'graprohab_sp_housing',
    title: 'Empreendimentos Habitacionais GRAPROHAB - Estado de SP',
    description: 'Polígonos de loteamentos, condomínios, conjuntos habitacionais e desmembramentos submetidos à análise do GRAPROHAB em todo o território paulista.',
    category: 'graprohab',
    geometryType: 'Polygon',
    featureCount: 18,
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '042/2024',
            nome_empreendimento: 'Residencial Alphaville Campinas Norte',
            municipio: 'Campinas',
            regiao_administrativa: 'RMC - Região Metropolitana de Campinas',
            interessado_empreendedor: 'Alphaville Urbanismo S.A.',
            tipo_empreendimento: 'Loteamento Fechado / Acesso Controlado',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-184/2024',
            quantidade_lotes_uh: 620,
            area_total_m2: 540000,
            area_lote_padrao_m2: 450,
            area_preservacao_app_m2: 112000,
            area_institucional_sistema_lazer_m2: 68000,
            bacia_hidrografica_ugrhi: 'UGRHI 05 - Piracicaba/Capivari/Jundiaí (PCJ)',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP, PMESP',
            data_protocolo: '2024-02-15',
            data_deliberacao: '2024-06-20',
            observacoes: 'Pareceres favoráveis sem restrições com TAC firmado para recuperação de APP.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.052, -22.845],
              [-47.038, -22.842],
              [-47.035, -22.854],
              [-47.048, -22.858],
              [-47.052, -22.845]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '118/2023',
            nome_empreendimento: 'Conjunto Habitacional Parque das Flores (CDHU)',
            municipio: 'Campinas',
            regiao_administrativa: 'RMC - Região Metropolitana de Campinas',
            interessado_empreendedor: 'CDHU - Cia Desenvolvimento Habitacional Urbano SP',
            tipo_empreendimento: 'Conjunto Habitacional HIS',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-412/2023',
            quantidade_lotes_uh: 850,
            area_total_m2: 285000,
            area_lote_padrao_m2: 140,
            area_preservacao_app_m2: 45000,
            area_institucional_sistema_lazer_m2: 52000,
            bacia_hidrografica_ugrhi: 'UGRHI 05 - Piracicaba/Capivari/Jundiaí (PCJ)',
            orgaos_envolvidos: 'CETESB, DAEE, SANASA',
            data_protocolo: '2023-05-10',
            data_deliberacao: '2023-09-14',
            observacoes: 'Habitação de Interesse Social (HIS) - Faixa 1 e 2 com infraestrutura completa.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.125, -22.920],
              [-47.112, -22.918],
              [-47.110, -22.931],
              [-47.123, -22.933],
              [-47.125, -22.920]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '089/2024',
            nome_empreendimento: 'Loteamento Reserva Ipanema',
            municipio: 'Sorocaba',
            regiao_administrativa: 'RMS - Região Metropolitana de Sorocaba',
            interessado_empreendedor: 'Setpar Empreendimentos Imobiliários',
            tipo_empreendimento: 'Loteamento Aberto',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-229/2024',
            quantidade_lotes_uh: 740,
            area_total_m2: 420000,
            area_lote_padrao_m2: 250,
            area_preservacao_app_m2: 78000,
            area_institucional_sistema_lazer_m2: 55000,
            bacia_hidrografica_ugrhi: 'UGRHI 10 - Sorocaba / Médio Tietê',
            orgaos_envolvidos: 'CETESB, DAEE, SAAE Sorocaba',
            data_protocolo: '2024-01-20',
            data_deliberacao: '2024-05-18',
            observacoes: 'Aprovado com diretrizes de drenagem pluvial e bacias de amortecimento.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.495, -23.460],
              [-47.478, -23.455],
              [-47.472, -23.468],
              [-47.490, -23.473],
              [-47.495, -23.460]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '205/2024',
            nome_empreendimento: 'Condomínio Residencial Villa Flora Sorocaba',
            municipio: 'Sorocaba',
            regiao_administrativa: 'RMS - Região Metropolitana de Sorocaba',
            interessado_empreendedor: 'Rossi Residencial / Congesa',
            tipo_empreendimento: 'Condomínio Urbanístico',
            status_graprohab: 'Em Análise Técnica',
            numero_certificado: 'Pendente',
            quantidade_lotes_uh: 490,
            area_total_m2: 310000,
            area_lote_padrao_m2: 300,
            area_preservacao_app_m2: 62000,
            area_institucional_sistema_lazer_m2: 39000,
            bacia_hidrografica_ugrhi: 'UGRHI 10 - Sorocaba / Médio Tietê',
            orgaos_envolvidos: 'CETESB, DAEE',
            data_protocolo: '2024-07-02',
            data_deliberacao: '2024-09-30 (Previsão)',
            observacoes: 'Em fase de análise conjunta CETESB/DAEE para laudo de vazão hídrica.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.442, -23.510],
              [-47.428, -23.505],
              [-47.425, -23.518],
              [-47.439, -23.522],
              [-47.442, -23.510]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '015/2024',
            nome_empreendimento: 'Residencial Quinta do Golfe Jardins',
            municipio: 'São José do Rio Preto',
            regiao_administrativa: 'RA de São José do Rio Preto',
            interessado_empreendedor: 'Encalso Damha Empreendimentos',
            tipo_empreendimento: 'Loteamento Fechado / Acesso Controlado',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-098/2024',
            quantidade_lotes_uh: 520,
            area_total_m2: 480000,
            area_lote_padrao_m2: 450,
            area_preservacao_app_m2: 95000,
            area_institucional_sistema_lazer_m2: 60000,
            bacia_hidrografica_ugrhi: 'UGRHI 15 - Turvo / Grande',
            orgaos_envolvidos: 'CETESB, DAEE, SeMAE',
            data_protocolo: '2024-01-12',
            data_deliberacao: '2024-04-25',
            observacoes: 'Certificado de aprovação emitido com cronograma de obras de 24 meses.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-49.390, -20.835],
              [-49.375, -20.830],
              [-49.370, -20.844],
              [-49.386, -20.849],
              [-49.390, -20.835]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '163/2024',
            nome_empreendimento: 'Loteamento Jardim Olhos D’Água II',
            municipio: 'Ribeirão Preto',
            regiao_administrativa: 'RMRP - Região Metropolitana de Ribeirão Preto',
            interessado_empreendedor: 'Habitax Desenvolvimento Imobiliário',
            tipo_empreendimento: 'Loteamento Aberto',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-312/2024',
            quantidade_lotes_uh: 920,
            area_total_m2: 610000,
            area_lote_padrao_m2: 300,
            area_preservacao_app_m2: 130000,
            area_institucional_sistema_lazer_m2: 85000,
            bacia_hidrografica_ugrhi: 'UGRHI 04 - Pardo',
            orgaos_envolvidos: 'CETESB, DAEE, SAERP',
            data_protocolo: '2024-03-18',
            data_deliberacao: '2024-07-11',
            observacoes: 'Zona Sul de Ribeirão Preto - Integração com plano viário municipal e corredor ecológico.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.820, -21.220],
              [-47.802, -21.215],
              [-47.798, -21.232],
              [-47.816, -21.236],
              [-47.820, -21.220]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '304/2024',
            nome_empreendimento: 'Residencial Reserva do Vale Urbanova',
            municipio: 'São José dos Campos',
            regiao_administrativa: 'RMVale - Região Metropolitana do Vale do Paraíba',
            interessado_empreendedor: 'Urbanova Participações e Empreendimentos',
            tipo_empreendimento: 'Condomínio Urbanístico',
            status_graprohab: 'Com Exigências Técnicas',
            numero_certificado: 'Aguardando Reanálise',
            quantidade_lotes_uh: 380,
            area_total_m2: 350000,
            area_lote_padrao_m2: 450,
            area_preservacao_app_m2: 98000,
            area_institucional_sistema_lazer_m2: 44000,
            bacia_hidrografica_ugrhi: 'UGRHI 02 - Paraíba do Sul',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP',
            data_protocolo: '2024-05-08',
            data_deliberacao: '2024-08-01',
            observacoes: 'Exigência técnica CETESB: Complementação de inventário arbóreo e compensação ambiental.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-45.945, -23.210],
              [-45.930, -23.205],
              [-45.926, -23.220],
              [-45.941, -23.224],
              [-45.945, -23.210]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '071/2024',
            nome_empreendimento: 'Loteamento Residencial Alphaville Bauru',
            municipio: 'Bauru',
            regiao_administrativa: 'RA de Bauru',
            interessado_empreendedor: 'Alphaville Urbanismo / Zopone Engenharia',
            tipo_empreendimento: 'Loteamento Fechado / Acesso Controlado',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-155/2024',
            quantidade_lotes_uh: 560,
            area_total_m2: 490000,
            area_lote_padrao_m2: 360,
            area_preservacao_app_m2: 105000,
            area_institucional_sistema_lazer_m2: 58000,
            bacia_hidrografica_ugrhi: 'UGRHI 13 - Tietê / Batalha',
            orgaos_envolvidos: 'CETESB, DAEE, DAE Bauru',
            data_protocolo: '2024-02-04',
            data_deliberacao: '2024-06-05',
            observacoes: 'Aprovado por unanimidade pelo colegiado do GRAPROHAB.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-49.075, -22.340],
              [-49.060, -22.335],
              [-49.055, -22.350],
              [-49.070, -22.355],
              [-49.075, -22.340]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '211/2024',
            nome_empreendimento: 'Residencial Terras de Piracicaba V',
            municipio: 'Piracicaba',
            regiao_administrativa: 'RMP - Região Metropolitana de Piracicaba',
            interessado_empreendedor: 'Sugoi Empreendimentos / Rossi',
            tipo_empreendimento: 'Loteamento Fechado / Acesso Controlado',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-277/2024',
            quantidade_lotes_uh: 430,
            area_total_m2: 380000,
            area_lote_padrao_m2: 360,
            area_preservacao_app_m2: 82000,
            area_institucional_sistema_lazer_m2: 48000,
            bacia_hidrografica_ugrhi: 'UGRHI 05 - Piracicaba/Capivari/Jundiaí (PCJ)',
            orgaos_envolvidos: 'CETESB, DAEE, SEMAE Piracicaba',
            data_protocolo: '2024-03-22',
            data_deliberacao: '2024-07-25',
            observacoes: 'Aprovado com sistema autônomo de tratamento de efluentes.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.670, -22.730],
              [-47.655, -22.725],
              [-47.650, -22.740],
              [-47.665, -22.745],
              [-47.670, -22.730]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '055/2024',
            nome_empreendimento: 'Loteamento Portal da Serra Jundiaí',
            municipio: 'Jundiaí',
            regiao_administrativa: 'AUJ - Aglomeração Urbana de Jundiaí',
            interessado_empreendedor: 'F.A. Oliva & Cia Empreendimentos',
            tipo_empreendimento: 'Loteamento Aberto',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-120/2024',
            quantidade_lotes_uh: 680,
            area_total_m2: 450000,
            area_lote_padrao_m2: 250,
            area_preservacao_app_m2: 95000,
            area_institucional_sistema_lazer_m2: 62000,
            bacia_hidrografica_ugrhi: 'UGRHI 05 - Piracicaba/Capivari/Jundiaí (PCJ)',
            orgaos_envolvidos: 'CETESB, DAEE, DAE Jundiaí',
            data_protocolo: '2024-01-29',
            data_deliberacao: '2024-05-12',
            observacoes: 'Próximo à Serra do Japi, com rigoroso plano de contenção de encostas e faixa de amortecimento.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-46.905, -23.195],
              [-46.890, -23.190],
              [-46.885, -23.204],
              [-46.900, -23.208],
              [-46.905, -23.195]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '188/2024',
            nome_empreendimento: 'Condomínio Reserva da Granja Viana',
            municipio: 'Cotia',
            regiao_administrativa: 'RMSP - Região Metropolitana de São Paulo',
            interessado_empreendedor: 'Even Construtora e Incorporadora',
            tipo_empreendimento: 'Condomínio Urbanístico',
            status_graprohab: 'Em Análise Técnica',
            numero_certificado: 'Pendente',
            quantidade_lotes_uh: 310,
            area_total_m2: 260000,
            area_lote_padrao_m2: 360,
            area_preservacao_app_m2: 74000,
            area_institucional_sistema_lazer_m2: 32000,
            bacia_hidrografica_ugrhi: 'UGRHI 06 - Alto Tietê',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP',
            data_protocolo: '2024-06-14',
            data_deliberacao: '2024-10-15 (Previsão)',
            observacoes: 'Análise de impacto no sistema viário da Rodovia Raposo Tavares (SP-270).'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-46.890, -23.605],
              [-46.875, -23.600],
              [-46.870, -23.612],
              [-46.885, -23.617],
              [-46.890, -23.605]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '097/2024',
            nome_empreendimento: 'Condomínio Tamboré Residencial 12',
            municipio: 'Santana de Parnaíba',
            regiao_administrativa: 'RMSP - Região Metropolitana de São Paulo',
            interessado_empreendedor: 'Tamboré Urbanismo S.A.',
            tipo_empreendimento: 'Loteamento Fechado / Acesso Controlado',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-201/2024',
            quantidade_lotes_uh: 410,
            area_total_m2: 390000,
            area_lote_padrao_m2: 500,
            area_preservacao_app_m2: 110000,
            area_institucional_sistema_lazer_m2: 45000,
            bacia_hidrografica_ugrhi: 'UGRHI 06 - Alto Tietê',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP',
            data_protocolo: '2024-02-27',
            data_deliberacao: '2024-06-28',
            observacoes: 'Aprovado com certidão de conformidade ambiental municipal e estadual.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-46.880, -23.475],
              [-46.865, -23.470],
              [-46.860, -23.484],
              [-46.875, -23.489],
              [-46.880, -23.475]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '144/2024',
            nome_empreendimento: 'Residencial Parque Brasil 500',
            municipio: 'Paulínia',
            regiao_administrativa: 'RMC - Região Metropolitana de Campinas',
            interessado_empreendedor: 'Pacaembu Construtora S.A.',
            tipo_empreendimento: 'Loteamento Aberto',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-260/2024',
            quantidade_lotes_uh: 1150,
            area_total_m2: 780000,
            area_lote_padrao_m2: 200,
            area_preservacao_app_m2: 140000,
            area_institucional_sistema_lazer_m2: 95000,
            bacia_hidrografica_ugrhi: 'UGRHI 05 - Piracicaba/Capivari/Jundiaí (PCJ)',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP',
            data_protocolo: '2024-03-05',
            data_deliberacao: '2024-07-08',
            observacoes: 'Grande empreendimento com doação de área para UBS, creche e parque linear.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.165, -22.755],
              [-47.148, -22.748],
              [-47.142, -22.766],
              [-47.160, -22.772],
              [-47.165, -22.755]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '320/2024',
            nome_empreendimento: 'Residencial Damha São Carlos II',
            municipio: 'São Carlos',
            regiao_administrativa: 'Central',
            interessado_empreendedor: 'Encalso Damha',
            tipo_empreendimento: 'Loteamento Fechado / Acesso Controlado',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-340/2024',
            quantidade_lotes_uh: 480,
            area_total_m2: 410000,
            area_lote_padrao_m2: 400,
            area_preservacao_app_m2: 92000,
            area_institucional_sistema_lazer_m2: 50000,
            bacia_hidrografica_ugrhi: 'UGRHI 13 - Tietê / Jacaré',
            orgaos_envolvidos: 'CETESB, DAEE, SAAE São Carlos',
            data_protocolo: '2024-04-18',
            data_deliberacao: '2024-08-14',
            observacoes: 'Adequação completa ao plano diretor e diretrizes do SAAE.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.885, -22.010],
              [-47.870, -22.005],
              [-47.865, -22.020],
              [-47.880, -22.025],
              [-47.885, -22.010]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '175/2024',
            nome_empreendimento: 'Loteamento Residencial Cristalina',
            municipio: 'Franca',
            regiao_administrativa: 'RA de Franca',
            interessado_empreendedor: 'Pilar Empreendimentos Imobiliários',
            tipo_empreendimento: 'Loteamento Aberto',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-288/2024',
            quantidade_lotes_uh: 590,
            area_total_m2: 360000,
            area_lote_padrao_m2: 200,
            area_preservacao_app_m2: 68000,
            area_institucional_sistema_lazer_m2: 46000,
            bacia_hidrografica_ugrhi: 'UGRHI 08 - Sapucaí / Grande',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP',
            data_protocolo: '2024-03-12',
            data_deliberacao: '2024-07-19',
            observacoes: 'Aprovado com termo de caução de obras de infraestrutura urbana.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.410, -20.540],
              [-47.395, -20.535],
              [-47.390, -20.550],
              [-47.405, -20.555],
              [-47.410, -20.540]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '245/2024',
            nome_empreendimento: 'Loteamento Damha Presidente Prudente',
            municipio: 'Presidente Prudente',
            regiao_administrativa: 'RA de Presidente Prudente',
            interessado_empreendedor: 'Damha Urbanizadora',
            tipo_empreendimento: 'Loteamento Fechado / Acesso Controlado',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-305/2024',
            quantidade_lotes_uh: 460,
            area_total_m2: 430000,
            area_lote_padrao_m2: 420,
            area_preservacao_app_m2: 89000,
            area_institucional_sistema_lazer_m2: 54000,
            bacia_hidrografica_ugrhi: 'UGRHI 22 - Pontal do Paranapanema',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP',
            data_protocolo: '2024-04-05',
            data_deliberacao: '2024-08-02',
            observacoes: 'Excelente integração ambiental com corredor de fauna regional.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-51.405, -22.125],
              [-51.390, -22.120],
              [-51.385, -22.135],
              [-51.400, -22.140],
              [-51.405, -22.125]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '360/2024',
            nome_empreendimento: 'Conjunto Habitacional Pimentas III (CDHU)',
            municipio: 'Guarulhos',
            regiao_administrativa: 'RMSP - Região Metropolitana de São Paulo',
            interessado_empreendedor: 'CDHU - Cia Desenvolvimento Habitacional Urbano SP',
            tipo_empreendimento: 'Conjunto Habitacional HIS',
            status_graprohab: 'Em Análise Técnica',
            numero_certificado: 'Pendente',
            quantidade_lotes_uh: 1400,
            area_total_m2: 510000,
            area_lote_padrao_m2: 125,
            area_preservacao_app_m2: 85000,
            area_institucional_sistema_lazer_m2: 70000,
            bacia_hidrografica_ugrhi: 'UGRHI 06 - Alto Tietê',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP',
            data_protocolo: '2024-07-15',
            data_deliberacao: '2024-11-20 (Previsão)',
            observacoes: 'Habitação de Interesse Social (HIS) - Regularização e reassentamento de famílias.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-46.435, -23.445],
              [-46.420, -23.440],
              [-46.415, -23.455],
              [-46.430, -23.460],
              [-46.435, -23.445]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            processo_graprohab: '012/2024',
            nome_empreendimento: 'Residencial Morro Nova Cintra (HIS)',
            municipio: 'Santos',
            regiao_administrativa: 'RMBS - Região Metropolitana da Baixada Santista',
            interessado_empreendedor: 'COHAB Santista / Prefeitura Municipal de Santos',
            tipo_empreendimento: 'Conjunto Habitacional HIS',
            status_graprohab: 'Aprovado com Certificado',
            numero_certificado: 'CERT-GRAPROHAB-085/2024',
            quantidade_lotes_uh: 320,
            area_total_m2: 180000,
            area_lote_padrao_m2: 150,
            area_preservacao_app_m2: 60000,
            area_institucional_sistema_lazer_m2: 28000,
            bacia_hidrografica_ugrhi: 'UGRHI 07 - Baixada Santista',
            orgaos_envolvidos: 'CETESB, DAEE, SABESP, Defesa Civil',
            data_protocolo: '2024-01-10',
            data_deliberacao: '2024-04-15',
            observacoes: 'Contém laudo geotécnico e laudo de estabilidade de taludes aprovado pelo IPT/Defesa Civil.'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-46.335, -23.955],
              [-46.322, -23.950],
              [-46.318, -23.962],
              [-46.331, -23.966],
              [-46.335, -23.955]
            ]]
          }
        }
      ]
    }
  },
  {
    id: 'sp_state_boundary',
    title: 'Perímetro e Macrorregiões do Estado de São Paulo',
    description: 'Limite territorial oficial do Estado de SP com dados demográficos, regiões administrativas e planejamento territorial.',
    category: 'planejamento',
    geometryType: 'Polygon',
    featureCount: 1,
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            estado: 'São Paulo',
            uf: 'SP',
            capital: 'São Paulo',
            populacao_estimada: 44411238,
            municipios_total: 645,
            area_territorial_km2: 248219.5,
            orgao_gestor: 'SDUH / GRAPROHAB / Governo do Estado de SP',
            cobertura_graprohab: '100% dos 645 municípios paulistas'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-53.1, -22.5],
              [-52.0, -21.4],
              [-50.8, -20.2],
              [-50.2, -19.8],
              [-47.9, -19.9],
              [-46.3, -19.9],
              [-44.2, -22.5],
              [-44.8, -23.4],
              [-45.2, -23.8],
              [-46.4, -24.0],
              [-48.0, -25.3],
              [-48.9, -25.0],
              [-50.0, -24.2],
              [-52.0, -23.2],
              [-53.1, -22.5]
            ]]
          }
        }
      ]
    }
  },
  {
    id: 'sp_ugrhi_basins',
    title: 'Bacias Hidrográficas & UGRHIs - Estado de SP',
    description: 'Unidades de Gerenciamento de Recursos Hídricos (UGRHI) do Estado de SP utilizadas nas análises DAEE e CETESB no GRAPROHAB.',
    category: 'ambiental',
    geometryType: 'Polygon',
    featureCount: 4,
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            ugrhi_numero: '05',
            nome_ugrhi: 'PCJ - Piracicaba, Capivari e Jundiaí',
            comite_bacia: 'CBH-PCJ',
            disponibilidade_hidrica: 'Crítica / Alta Demanda',
            municipios_abrangidos: 76,
            area_km2: 15303
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.8, -22.4],
              [-46.7, -22.4],
              [-46.6, -23.3],
              [-47.7, -23.3],
              [-47.8, -22.4]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            ugrhi_numero: '06',
            nome_ugrhi: 'Alto Tietê (RMSP)',
            comite_bacia: 'CBH-AT',
            disponibilidade_hidrica: 'Muito Crítica / Mananciais Protegidos',
            municipios_abrangidos: 39,
            area_km2: 5868
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-47.0, -23.3],
              [-45.9, -23.3],
              [-46.0, -23.9],
              [-47.0, -23.9],
              [-47.0, -23.3]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            ugrhi_numero: '10',
            nome_ugrhi: 'Sorocaba e Médio Tietê',
            comite_bacia: 'CBH-SMT',
            disponibilidade_hidrica: 'Média / Controlada',
            municipios_abrangidos: 34,
            area_km2: 11829
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-48.2, -23.1],
              [-47.2, -23.1],
              [-47.2, -23.9],
              [-48.2, -23.9],
              [-48.2, -23.1]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            ugrhi_numero: '04',
            nome_ugrhi: 'Pardo (Ribeirão Preto)',
            comite_bacia: 'CBH-Pardo',
            disponibilidade_hidrica: 'Boa / Aquífero Guarani',
            municipios_abrangidos: 27,
            area_km2: 8993
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-48.3, -21.0],
              [-47.1, -21.0],
              [-47.1, -21.8],
              [-48.3, -21.8],
              [-48.3, -21.0]
            ]]
          }
        }
      ]
    }
  }
];
