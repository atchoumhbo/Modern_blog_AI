INSERT INTO users (
  id, 
  email, 
  username, 
  password, 
  "firstName", 
  "lastName", 
  "isAdmin", 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'boujraf.hicham@gmail.com',
  'hicham',
  '$2b$10$Ay8Fs5iAnh1Hc8KSGpO5i.c8yLoGXZlyc/pygXS8mS6thDqjP.9HC',
  'Hicham',
  'Boujraf',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  "isAdmin" = true,
  "isActive" = true,
  "updatedAt" = NOW();
