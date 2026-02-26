
-- Delete orphan express_auto drafts and their related data
DELETE FROM quiz_step_analytics WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE creation_source = 'express_auto' AND status = 'draft'
);
DELETE FROM quiz_form_config WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE creation_source = 'express_auto' AND status = 'draft'
);
DELETE FROM quiz_results WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE creation_source = 'express_auto' AND status = 'draft'
);
DELETE FROM quiz_questions WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE creation_source = 'express_auto' AND status = 'draft'
);
DELETE FROM quiz_analytics WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE creation_source = 'express_auto' AND status = 'draft'
);
DELETE FROM quiz_tag_relations WHERE quiz_id IN (
  SELECT id FROM quizzes WHERE creation_source = 'express_auto' AND status = 'draft'
);
DELETE FROM quizzes WHERE creation_source = 'express_auto' AND status = 'draft';
