-- Create test user for N8N workflow testing
INSERT INTO "User" (email, name, "createdAt", "updatedAt") 
VALUES ('test@example.com', 'Test User', NOW(), NOW()) 
ON CONFLICT (email) DO NOTHING;

-- Show created user
SELECT id, email, name FROM "User" LIMIT 1;
