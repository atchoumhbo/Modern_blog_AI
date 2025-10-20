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
  'n8n-automation-user',
  'n8n@blog.bh-systems.be',
  'n8n_bot',
  '$2b$10$Ot0fuBG38p6/9JgQMLjpl.r0wh/LZJbLFgpuM/NVfawjwnuskBV/O',
  'N8N',
  'Automation Bot',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "isActive" = true,
  "updatedAt" = NOW();
