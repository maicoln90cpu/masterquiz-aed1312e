-- Backfill featured images for existing posts without images
UPDATE blog_posts 
SET featured_image_url = 'https://placehold.co/1200x630/10B981/FFFFFF?text=Lead+Scoring+com+Quiz',
    og_image_url = 'https://placehold.co/1200x630/10B981/FFFFFF?text=Lead+Scoring+com+Quiz'
WHERE id = '1844d083-2818-435a-88e7-293c31360f38' AND featured_image_url IS NULL;

UPDATE blog_posts 
SET featured_image_url = 'https://placehold.co/1200x630/10B981/FFFFFF?text=Quizzes+Interativos+Conversao',
    og_image_url = 'https://placehold.co/1200x630/10B981/FFFFFF?text=Quizzes+Interativos+Conversao'
WHERE id = '97f3630b-0c15-4f18-bc8a-0df570a2b365' AND featured_image_url IS NULL;