/**
 * Mapeamento de features dos planos (em português) para chaves de tradução
 * Usado para traduzir dinamicamente as features dos planos de assinatura
 */

const FEATURE_MAP: Record<string, string> = {
  // Funis
  "2 funis ativos": "planFeatures.funnels2Active",
  "5 funis ativos": "planFeatures.funnels5Active",
  "10 funis ativos": "planFeatures.funnels10Active",
  "Funis ilimitados": "planFeatures.unlimitedFunnels",
  
  // Respostas
  "100 respostas/mês": "planFeatures.responses200PerMonth",
  "200 respostas/mês": "planFeatures.responses200PerMonth",
  "500 respostas/mês": "planFeatures.responses500PerMonth",
  "2000 respostas/mês": "planFeatures.responses2000PerMonth",
  "5000 respostas/mês": "planFeatures.responses2000PerMonth",
  "Respostas ilimitadas": "planFeatures.unlimitedResponses",
  
  // Lead Management
  "Gerenciamento de Leads - 1000": "planFeatures.leadManagement1000",
  "Gerenciamento de Leads - 3000": "planFeatures.leadManagement3000",
  "Gerenciamento de Leads - 10000": "planFeatures.leadManagement10000",
  "Gerenciamento de Leads ilimitado": "planFeatures.unlimitedLeadManagement",
  
  // Suporte
  "Suporte básico": "planFeatures.basicSupport",
  "Suporte prioritário": "planFeatures.prioritySupport",
  "Suporte dedicado": "planFeatures.dedicatedSupport",
  
  // Features
  "Remoção de marca": "planFeatures.brandingRemoval",
  "Integração webhook": "planFeatures.webhookIntegration",
  "Integrações avançadas": "planFeatures.advancedIntegrations",
  "Domínio personalizado": "planFeatures.customDomain",
  "Análises básicas": "planFeatures.analytics",
  "Análises avançadas": "planFeatures.advancedAnalytics",
  "Exportação de dados": "planFeatures.exportData",
  "Acesso API": "planFeatures.apiAccess",
  "Acesso multiusuário": "planFeatures.multiUser",
  "Marca branca": "planFeatures.whiteLabel",
  "Relatórios PDF": "planFeatures.pdfReports",
  "Google Tag Manager": "planFeatures.advancedIntegrations",
  "Facebook Pixel": "planFeatures.advancedIntegrations",
  "Webhooks": "planFeatures.webhookIntegration",
  "White Label": "planFeatures.whiteLabel",
  "Domínio Próprio": "planFeatures.customDomain",
};

/**
 * Retorna a chave de tradução para uma feature
 * Se a feature não estiver mapeada, retorna a própria feature (fallback)
 * Se começar com "index.", remove e busca a chave correspondente
 */
export const getFeatureTranslationKey = (feature: string): string => {
  // Se já está mapeado, retorna
  if (FEATURE_MAP[feature]) {
    return FEATURE_MAP[feature];
  }
  
  // Se começa com "index.", tenta remover prefix e buscar
  if (feature.startsWith('index.')) {
    const keyWithoutPrefix = feature.replace('index.', '');
    // Tenta encontrar no mapa procurando pela chave sem prefix
    const matchingKey = Object.entries(FEATURE_MAP).find(([_, value]) => 
      value.includes(keyWithoutPrefix)
    );
    if (matchingKey) {
      return matchingKey[1];
    }
  }
  
  // Fallback: retorna a própria feature (será exibida como está no banco)
  return feature;
};
