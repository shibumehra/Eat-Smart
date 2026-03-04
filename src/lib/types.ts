export interface ProductReport {
  productName: string;
  brand: string;
  category: string;
  foodType: 'veg' | 'non-veg' | 'unknown';
  overallScore: number;
  verdict: 'Buy' | 'Avoid' | 'Try Once';
  ingredientPurityScore: number;
  reviewAuthenticity: number;
  regulatoryStatus: 'Certified' | 'Not Certified' | 'Unknown';
  regulatoryReasoning: string;
  crossRegionCertifications: Record<string, string>;
  valueForMoney: number;
  about: string;
  foodScoutVerdict: string;
  pros: string[];
  cons: string[];
  ingredients: IngredientTag[];
  healthierAlternatives: Alternative[];
  healthVerdict: Record<string, string>;
  publicSentiment: { positive: number; neutral: number; negative: number; totalReviews: number };
  topReviews: Review[];
}

export interface IngredientTag {
  name: string;
  status: 'safe' | 'caution' | 'harmful' | 'unknown';
  detail: string;
}

export interface Alternative {
  name: string;
  score: number;
  brand: string;
  ingredientPurityScore?: number;
  verdict?: 'Buy' | 'Avoid' | 'Try Once';
  valueForMoney?: number;
  regulatoryStatus?: string;
  reviewAuthenticity?: number;
  reason?: string;
}

export interface Review {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  platform: string;
  author: string;
}
