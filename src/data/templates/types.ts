// Re-export the QuizTemplate interface for modular templates
export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_qualification' | 'product_discovery' | 'customer_satisfaction' | 'engagement';
  icon: string;
  preview: {
    title: string;
    description: string;
    questionCount: number;
    template: string;
  };
  config: {
    title: string;
    description: string;
    questionCount: number;
    template: string;
    questions: Array<{
      id?: string;
      question_text: string;
      custom_label?: string;
      answer_format: 'single_choice' | 'multiple_choice' | 'yes_no';
      options: Array<{ text: string; value: string; imageUrl?: string }>;
      order_number: number;
      blocks?: any[];
    }>;
    formConfig: {
      collect_name: boolean;
      collect_email: boolean;
      collect_whatsapp: boolean;
      collection_timing: 'before' | 'after';
    };
    results: Array<{
      result_text: string;
      button_text: string;
      condition_type: 'always' | 'score_range' | 'specific_answers';
      order_number: number;
    }>;
  };
}
