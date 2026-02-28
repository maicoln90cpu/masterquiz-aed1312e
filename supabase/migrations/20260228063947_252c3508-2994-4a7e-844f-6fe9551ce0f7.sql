UPDATE blog_settings
SET image_prompt_template = 'Generate an image: A cinematic, photorealistic hero image for a blog article about "{{topic}}".

CAMERA SIMULATION: Shot on Canon EOS R5, 35mm f/1.4L lens, shallow depth of field, bokeh background.
LIGHTING: Golden hour natural light streaming from left side, complemented by subtle teal LED accent lighting from screens and monitors.
COLOR GRADING: Cinematic teal and orange color grading, rich shadows, warm highlights, professional post-processing.
COMPOSITION: Rule of thirds, leading lines, diagonal composition. Subject in focus with soft background blur.
SCENE: A high-end modern workspace or creative studio environment. Include subtle elements related to the topic: sleek monitors showing dashboard analytics, interactive UI elements, data visualizations, or marketing metrics. Clean desk with premium tech accessories.
ATMOSPHERE: Professional, inspiring, premium feel. Depth and dimension through layered elements in foreground and background.
STYLE: Editorial photography quality, magazine cover worthy. Ultra high resolution, 16:9 aspect ratio.

ABSOLUTE RULES:
- NO text, NO words, NO letters, NO watermarks, NO logos anywhere in the image
- NO cartoons, NO illustrations, NO flat design, NO clip art
- ONLY photorealistic, camera-quality imagery
- NO people faces (avoid AI face artifacts), use hands/silhouettes if needed
- Focus on environment, objects, screens, and atmosphere'
WHERE id IS NOT NULL;