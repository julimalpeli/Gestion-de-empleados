-- Comando 3 corregido - Crear en tabla users con password_hash
INSERT INTO public.users (
  id,
  email,
  username,
  name,
  role,
  password_hash,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'julimalpeli@gmail.com'),
  'julimalpeli@gmail.com',
  'admin',
  'Julian Malpeli',
  'admin',
  crypt('Jmalpeli3194', gen_salt('bf')),
  NOW(),
  NOW()
);
