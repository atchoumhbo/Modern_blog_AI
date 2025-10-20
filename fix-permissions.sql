-- Fix Strapi Public API Permissions
-- This script creates permissions and links them to the Public role (id=4)

-- Step 1: Clean up existing permission links for Public role
DELETE FROM up_permissions_role_lnk WHERE role_id = 4;

-- Step 2: Clean up old permissions that might exist
DELETE FROM up_permissions WHERE action LIKE 'api::article.%' OR action LIKE 'api::project.%' OR action LIKE 'api::category.%' OR action LIKE 'api::tag.%' OR action LIKE 'api::author.%';

-- Step 3: Insert all permissions and link them to Public role in one go
DO $$
DECLARE
  perm_id INTEGER;
  actions TEXT[] := ARRAY[
    'api::article.article.find',
    'api::article.article.findOne',
    'api::project.project.find',
    'api::project.project.findOne',
    'api::category.category.find',
    'api::category.category.findOne',
    'api::tag.tag.find',
    'api::tag.tag.findOne',
    'api::author.author.find',
    'api::author.author.findOne'
  ];
  action_name TEXT;
BEGIN
  FOREACH action_name IN ARRAY actions
  LOOP
    -- Insert permission
    INSERT INTO up_permissions (action, created_at, updated_at, published_at)
    VALUES (action_name, NOW(), NOW(), NOW())
    RETURNING id INTO perm_id;
    
    -- Link to Public role (id=4)
    INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord)
    VALUES (perm_id, 4, 1);
    
    RAISE NOTICE 'Created permission: % (id=%)', action_name, perm_id;
  END LOOP;
END $$;

-- Step 4: Verify the permissions were created
SELECT p.id, p.action, r.name as role_name
FROM up_permissions p
JOIN up_permissions_role_lnk l ON l.permission_id = p.id
JOIN up_roles r ON r.id = l.role_id
WHERE r.id = 4
ORDER BY p.action;
