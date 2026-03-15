
-- Create blog_image_prompts table
CREATE TABLE public.blog_image_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  style_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_image_prompts ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins manage blog image prompts"
  ON public.blog_image_prompts
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Service role can read (for edge functions)
CREATE POLICY "Service can read blog image prompts"
  ON public.blog_image_prompts
  FOR SELECT
  TO service_role
  USING (true);

-- Seed 5 prompts (styles 1, 2, 3, 5, 9)
INSERT INTO public.blog_image_prompts (name, prompt_template, style_description) VALUES

('Objetos 3D Vibrantes', 
'Generate an image: A stunning 3D render of objects related to "{{topic}}" floating on a vibrant solid color background.

STYLE: Clean 3D product photography, Apple-style minimalism with bold saturated colors.
OBJECTS: 3D rendered objects metaphorically related to the topic — funnels, targets, charts, magnifying glasses, rockets, gears, screens with dashboards. Objects should have glossy/matte material with soft shadows.
BACKGROUND: Single bold saturated color (choose from: electric blue #2563EB, hot pink #EC4899, deep purple #7C3AED, emerald green #059669, vivid orange #EA580C). Clean gradient from the solid color.
LIGHTING: Soft studio lighting from top-left, subtle rim light, ambient occlusion for depth.
COMPOSITION: Objects floating with subtle rotation, scattered arrangement with depth. Some objects slightly blurred for depth of field effect.
RENDER: Ultra-high quality 3D render, smooth surfaces, realistic materials, 16:9 aspect ratio.

ABSOLUTE RULES:
- NO text, NO words, NO letters, NO watermarks, NO logos
- NO cartoons or flat illustrations — ONLY premium 3D renders
- NO people or faces
- Objects must look tactile and premium, like physical products in a studio
- Background must be a SINGLE bold color, not a gradient scene', 
'Objetos 3D premium flutuando sobre fundo monocromático vibrante (azul, rosa, roxo). Estilo Apple/produto.'),

('Pessoa Real Cenário Pop',
'Generate an image: An editorial-style photograph of a person (seen from behind, hands only, or silhouette — NO visible face) in a vibrant, colorful environment related to "{{topic}}".

STYLE: Modern editorial photography, lifestyle magazine quality. Think Wired Magazine or Fast Company covers.
PERSON: Show only hands typing on a laptop, a silhouette against a colorful wall, or someone from behind looking at screens. NEVER show a clear face.
ENVIRONMENT: Trendy modern office or creative space with bold colored walls (pink, turquoise, yellow, coral). Neon signs (blurred/no text), colorful furniture, plants, tech gadgets.
COLOR PALETTE: Pop art inspired — combinations of hot pink + turquoise, coral + electric blue, yellow + purple. High saturation, joyful and energetic.
LIGHTING: Bright, even lighting with some colorful accent lights. Golden hour feel mixed with neon accents.
CAMERA: Shot on Sony A7III, 50mm f/1.8, shallow depth of field, natural bokeh.
COMPOSITION: Subject occupies 40% of frame, environment tells the story. Leading lines, rule of thirds.

ABSOLUTE RULES:
- NO visible faces — use back of head, hands, silhouettes only
- NO text, NO words, NO watermarks, NO logos anywhere
- ONLY real photography style, NOT illustration or 3D
- Colors must be VIBRANT and SATURATED, not muted
- Must feel modern, young, and energetic — NOT corporate or boring
- 16:9 aspect ratio, ultra high resolution',
'Pessoa real (sem rosto) em ambiente colorido pop com cores vibrantes. Estilo editorial lifestyle.'),

('Flat Lay Temático',
'Generate an image: A stunning top-down flat lay photograph of a carefully arranged desk scene related to "{{topic}}".

STYLE: Professional flat lay photography, Instagram-worthy overhead shot. Think Unsplash premium or Kinfolk magazine.
OBJECTS: Carefully arranged items on a clean surface — MacBook Pro, iPhone, coffee cup (latte art), notebook with pen, colorful sticky notes, succulent plant, AirPods, glasses, color swatches, printed charts/graphs. Items should subtly relate to the topic.
SURFACE: Clean background surface — marble, light wood, concrete, or solid pastel color (mint, blush pink, lavender, soft yellow).
COLOR SCHEME: Harmonious palette with 2-3 accent colors. Objects should have coordinated colors (e.g., all accessories in rose gold, or all notes in gradient pastels).
LIGHTING: Soft, even overhead lighting with minimal shadows. Natural daylight feel. Some items casting very subtle shadows for depth.
ARRANGEMENT: Grid-like but organic. Strategic spacing between items. Some items slightly overlapping. Golden ratio spacing.
CAMERA: Shot directly from above, perfectly flat, no perspective distortion. High resolution macro quality.

ABSOLUTE RULES:
- NO text visible on screens or papers — screens should show colorful blurred UI/dashboards
- NO watermarks, NO logos, NO readable text anywhere
- NOT a real desk — this is a STYLED, curated arrangement
- Surface must be CLEAN and MINIMAL
- Items must look PREMIUM and REAL, not clip art
- 16:9 aspect ratio',
'Vista de cima (flat lay) de mesa premium com objetos tech e coloridos organizados artisticamente.'),

('Conceitual Hiper-Realista',
'Generate an image: A hyper-realistic conceptual photograph featuring a surreal, metaphorical scene related to "{{topic}}".

STYLE: Conceptual advertising photography. Think award-winning ad campaigns — real objects in surreal contexts. Photo manipulation that looks completely real.
CONCEPT: Create a visual metaphor for the topic using scale distortion or unexpected contexts:
- A giant glowing magnifying glass hovering over a laptop keyboard
- A miniature rocket launching from a smartphone screen with real smoke
- Oversized golden gears interlocking around a real monitor
- A giant lightbulb illuminating a dark workspace with volumetric light
- Chess pieces on a desk where the board is a tablet screen
ENVIRONMENT: Real-world setting (desk, office, studio) with one surreal/oversized element that creates the "wow" factor.
LIGHTING: Dramatic cinematic lighting — strong key light from one side, volumetric rays, lens flare. Mix of warm and cool temperatures.
COLORS: Rich, cinematic color grading — teal shadows, warm highlights. Deep contrast.
CAMERA: Shot on Hasselblad medium format, incredibly sharp details, shallow depth of field on the surreal element.

ABSOLUTE RULES:
- NO text, NO words, NO letters, NO watermarks anywhere
- The surreal element must look PHOTOREALISTIC, not CGI or cartoon
- Must have ONE clear focal point (the metaphorical object)
- NO people faces — hands or silhouettes OK
- Everything except the surreal element should look 100% real
- 16:9 aspect ratio, cinematic quality',
'Objeto metafórico gigante/surreal em cenário real (lupa, foguete, engrenagens). Mix de real e surreal hiper-realista.'),

('Gradiente Abstrato com Elemento Central',
'Generate an image: A modern, sleek image with a vibrant abstract gradient background and a single prominent 3D element in the center related to "{{topic}}".

STYLE: Modern SaaS/tech hero image. Think Stripe, Linear, or Vercel marketing pages. Ultra-clean and contemporary.
BACKGROUND: Flowing abstract gradient using 2-3 colors — aurora borealis style, sunset spectrum, or neon mesh gradients. Options:
- Deep purple → electric blue → cyan
- Sunset orange → magenta → violet  
- Emerald green → teal → deep blue
- Coral → pink → lavender
Gradient should have organic flow with subtle noise texture for premium feel.
CENTRAL ELEMENT: One floating 3D object or UI element related to the topic — a glassmorphism card showing a blurred dashboard, a 3D chart/graph, a floating smartphone with colorful UI, or an abstract geometric shape (icosahedron, torus) with metallic/glass material.
EFFECTS: Subtle floating particles, soft bokeh dots, light rays. Glass refraction on the central element. Soft glow emanating from the object.
DEPTH: Layered composition — gradient background, some blurred elements in mid-ground, sharp central element, subtle foreground particles.

ABSOLUTE RULES:
- NO text, NO words, NO letters, NO watermarks, NO logos
- Central element must be SHARP and PROMINENT against the soft gradient
- Gradient must look PREMIUM, not cheap or Microsoft Paint
- NOT flat design — must have depth, dimension, and lighting
- Clean, minimal composition — avoid clutter
- 16:9 aspect ratio, 4K quality feel',
'Gradiente vibrante abstrato (aurora/sunset) com elemento 3D central flutuante. Estilo SaaS moderno (Stripe/Linear).');
