-- ============================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Addresses: Privilege Escalation, Role-Based Access, Data Exposure
-- ============================================

-- ============================================
-- 1. FIX SUPPLIERS TABLE - Restrict to Organization
-- ============================================
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view suppliers from their organization" ON suppliers;
DROP POLICY IF EXISTS "Users can create suppliers for their organization" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers from their organization" ON suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers from their organization" ON suppliers;

-- Create granular policies for suppliers table
CREATE POLICY "org_members_select_suppliers"
ON suppliers FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "org_members_insert_suppliers"
ON suppliers FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "org_members_update_suppliers"
ON suppliers FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "admins_delete_suppliers"
ON suppliers FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
);

-- ============================================
-- 2. FIX FINANCIAL TRANSACTIONS - Granular Role-Based Policies
-- ============================================
-- Drop existing overly permissive ALL policy
DROP POLICY IF EXISTS "Users can manage financial transactions from their organization" ON financial_transactions;

-- Create granular policies for financial_transactions
CREATE POLICY "org_select_transactions"
ON financial_transactions FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "org_insert_transactions"
ON financial_transactions FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "limited_update_transactions"
ON financial_transactions FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  AND (
    -- Allow creator to update within 24 hours
    (created_by = auth.uid() AND created_at > now() - interval '24 hours')
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
);

CREATE POLICY "admin_delete_transactions"
ON financial_transactions FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
);

-- ============================================
-- 3. FIX USER_ROLES - Prevent Privilege Escalation (CRITICAL)
-- ============================================
-- Enable RLS if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Users can view their own roles
CREATE POLICY "users_view_own_roles"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- Admins and superadmins can view all roles in their org
CREATE POLICY "admins_view_org_roles"
ON user_roles FOR SELECT
USING (
  (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND user_id IN (
    SELECT uo.user_id 
    FROM user_organizations uo
    WHERE uo.org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  )
);

-- Prevent privilege escalation on INSERT
CREATE POLICY "prevent_privilege_escalation_insert"
ON user_roles FOR INSERT
WITH CHECK (
  user_id != auth.uid() -- Cannot assign roles to self
  AND (
    has_role(auth.uid(), 'superadmin'::app_role)
    OR (
      has_role(auth.uid(), 'admin'::app_role) 
      AND role != 'superadmin'::app_role -- Admins can't create superadmins
    )
  )
);

-- Prevent self-role removal and unauthorized deletions
CREATE POLICY "prevent_self_role_removal"
ON user_roles FOR DELETE
USING (
  user_id != auth.uid() -- Cannot remove own roles
  AND (
    has_role(auth.uid(), 'superadmin'::app_role)
    OR (
      has_role(auth.uid(), 'admin'::app_role) 
      AND role != 'superadmin'::app_role -- Admins can't remove superadmin roles
    )
  )
);

-- Prevent unauthorized role updates
CREATE POLICY "prevent_role_tampering"
ON user_roles FOR UPDATE
USING (
  user_id != auth.uid() -- Cannot modify own roles
  AND (
    has_role(auth.uid(), 'superadmin'::app_role)
    OR (
      has_role(auth.uid(), 'admin'::app_role)
      AND role != 'superadmin'::app_role -- Admins can't modify superadmin roles
    )
  )
);

-- ============================================
-- 4. FIX BANK ACCOUNTS - Role-Based DELETE
-- ============================================
-- Drop existing ALL policy
DROP POLICY IF EXISTS "Users can manage bank accounts from their organization" ON bank_accounts;

-- Create granular policies
CREATE POLICY "org_select_bank_accounts"
ON bank_accounts FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "org_insert_bank_accounts"
ON bank_accounts FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "org_update_bank_accounts"
ON bank_accounts FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "admins_delete_bank_accounts"
ON bank_accounts FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
);

-- ============================================
-- 5. FIX SUBSCRIPTION PLANS - Superadmin Only
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Superadmins can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view active subscription plans" ON subscription_plans;

-- Only superadmins can manage plans
CREATE POLICY "only_superadmin_manage_plans"
ON subscription_plans FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- All authenticated users can view active plans
CREATE POLICY "users_view_active_plans"
ON subscription_plans FOR SELECT
USING (is_active = true);

-- ============================================
-- 6. FIX PROFILES - Add Organization Context
-- ============================================
-- Note: Profiles currently only allow users to see their own data
-- This is correct, but we add a comment for clarity
COMMENT ON TABLE profiles IS 'User profiles with self-only access. Users can only view/modify their own profile.';

-- ============================================
-- 7. FIX MODULE PERMISSIONS - Prevent Self-Escalation
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all module permissions" ON module_permissions;
DROP POLICY IF EXISTS "Users can view their own module permissions" ON module_permissions;

-- Users can view their own permissions
CREATE POLICY "users_view_own_permissions"
ON module_permissions FOR SELECT
USING (user_id = auth.uid());

-- Admins can view permissions in their org
CREATE POLICY "admins_view_org_permissions"
ON module_permissions FOR SELECT
USING (
  (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Admins can insert permissions (but not for themselves)
CREATE POLICY "admins_insert_permissions"
ON module_permissions FOR INSERT
WITH CHECK (
  user_id != auth.uid() -- Cannot modify own permissions
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Admins can update permissions (but not their own)
CREATE POLICY "admins_update_permissions"
ON module_permissions FOR UPDATE
USING (
  user_id != auth.uid()
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Admins can delete permissions (but not their own)
CREATE POLICY "admins_delete_permissions"
ON module_permissions FOR DELETE
USING (
  user_id != auth.uid()
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'superadmin'::app_role)
  )
  AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);