export interface QuestionnaireResponse {
  walletAddress: string;
  answers: {
    q1_purpose: string[];
    q2_accounts: string;
    q3_behavior: string;
    q4_sanctions: string;
    q5_conflict: string;
    q6_agreements: string;
    q7_risky_practices: string;
    q8_security: string;
    q9_experience: string;
    q10_education: string;
    q11_importance: string;
    q12_trustworthy_experience: string;
    q13_scam_response: string;
    q14_values: string;
    q15_self_rating: number;
    q16_reevaluation: string;
  };
}

export interface ReputationScore {
  score: number;
  walletAddress: string;
  timestamp: string;
  breakdown: {
    trustworthiness: number;
    security: number;
    experience: number;
    behavior: number;
  };
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple' | 'text' | 'number' | 'multiselect';
  options?: string[];
  placeholder?: string;
}
