-- Insert sample templates
INSERT INTO public.templates (name, description, category, price, preview_url, demo_url, thumbnail_url, featured, created_by)
SELECT
  'Elegant Garden Wedding',
  'A sophisticated template for garden-themed weddings with floral designs',
  'Garden',
  49.99,
  'https://example.com/preview/elegant-garden',
  'https://example.com/demo/elegant-garden',
  'https://via.placeholder.com/300x200?text=Elegant+Garden',
  true,
  profiles.id
FROM public.profiles LIMIT 1
UNION ALL
SELECT
  'Modern Urban Wedding',
  'Contemporary design perfect for city weddings and modern couples',
  'Urban',
  39.99,
  'https://example.com/preview/modern-urban',
  'https://example.com/demo/modern-urban',
  'https://via.placeholder.com/300x200?text=Modern+Urban',
  true,
  profiles.id
FROM public.profiles LIMIT 1
UNION ALL
SELECT
  'Romantic Beach Wedding',
  'Beautiful ocean-inspired template with tropical elements',
  'Beach',
  44.99,
  'https://example.com/preview/romantic-beach',
  'https://example.com/demo/romantic-beach',
  'https://via.placeholder.com/300x200?text=Romantic+Beach',
  false,
  profiles.id
FROM public.profiles LIMIT 1
UNION ALL
SELECT
  'Classic Ballroom',
  'Traditional elegant design for formal indoor celebrations',
  'Ballroom',
  59.99,
  'https://example.com/preview/classic-ballroom',
  'https://example.com/demo/classic-ballroom',
  'https://via.placeholder.com/300x200?text=Classic+Ballroom',
  false,
  profiles.id
FROM public.profiles LIMIT 1
UNION ALL
SELECT
  'Rustic Barn Wedding',
  'Charming country-style template with rustic charm',
  'Rustic',
  39.99,
  'https://example.com/preview/rustic-barn',
  'https://example.com/demo/rustic-barn',
  'https://via.placeholder.com/300x200?text=Rustic+Barn',
  false,
  profiles.id
FROM public.profiles LIMIT 1;
