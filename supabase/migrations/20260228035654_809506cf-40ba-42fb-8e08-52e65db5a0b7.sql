UPDATE blog_posts 
SET status = 'published', published_at = now()
WHERE id IN ('1844d083-2818-435a-88e7-293c31360f38', '97f3630b-0c15-4f18-bc8a-0df570a2b365')
AND status = 'draft';