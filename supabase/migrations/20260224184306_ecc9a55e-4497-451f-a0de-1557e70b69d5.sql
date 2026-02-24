-- Add show_results column to quizzes table (default true for backward compatibility)
ALTER TABLE public.quizzes ADD COLUMN show_results boolean DEFAULT true;

-- Update the get_quiz_for_display function to include show_results in the quiz object
-- (it already returns to_jsonb(quiz_record) so the new column is automatically included)