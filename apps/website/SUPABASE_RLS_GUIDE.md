# Supabase Row Level Security (RLS) Configuration Guide

This guide explains how to configure Row Level Security (RLS) policies for the ECPS/Effinor application to ensure data security and proper access control.

## What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL feature that allows you to control access to individual rows in a table based on the user executing a query. In Supabase, RLS policies are defined using SQL and can check user authentication status, roles, and other conditions.

## Current Status

⚠️ **IMPORTANT**: RLS policies need to be verified and configured in your Supabase Dashboard. This guide provides the recommended policies.

## Why RLS is Critical

Without RLS:
- ❌ Anyone with the anon key can read/write all data
- ❌ No access control between users
- ❌ Security vulnerabilities

With RLS:
- ✅ Fine-grained access control
- ✅ Users can only access their own data
- ✅ Admins have elevated permissions
- ✅ Anonymous users can only insert (for forms)

---

## Recommended Policies

### Table: `leads`

**Purpose**: Store prospect/lead data from forms

#### Policy 1: Allow Anonymous INSERT (Form Submissions)
```sql
-- Allow anyone to insert leads (for public forms)
CREATE POLICY "Allow anonymous insert on leads"
ON leads
FOR INSERT
TO anon
WITH CHECK (true);
```

#### Policy 2: Require Authentication for SELECT
```sql
-- Only authenticated users can read leads
CREATE POLICY "Authenticated users can read leads"
ON leads
FOR SELECT
TO authenticated
USING (true);
```

#### Policy 3: Admin Only UPDATE
```sql
-- Only admins can update leads
CREATE POLICY "Admins can update leads"
ON leads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

#### Policy 4: Admin Only DELETE
```sql
-- Only admins can delete leads
CREATE POLICY "Admins can delete leads"
ON leads
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

### Table: `products`

**Purpose**: Product catalog (public + admin management)

#### Policy 1: Public SELECT (Active Products Only)
```sql
-- Anyone can view active products
CREATE POLICY "Public can view active products"
ON products
FOR SELECT
TO anon, authenticated
USING (actif = true);
```

#### Policy 2: Authenticated SELECT (All Products)
```sql
-- Authenticated users can view all products
CREATE POLICY "Authenticated can view all products"
ON products
FOR SELECT
TO authenticated
USING (true);
```

#### Policy 3: Admin Only INSERT/UPDATE/DELETE
```sql
-- Only admins can manage products
CREATE POLICY "Admins can manage products"
ON products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

### Table: `commandes`

**Purpose**: Customer orders

#### Policy 1: Authenticated INSERT
```sql
-- Authenticated users can create orders
CREATE POLICY "Authenticated can create orders"
ON commandes
FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### Policy 2: Own Orders SELECT
```sql
-- Users can only view their own orders
CREATE POLICY "Users can view own orders"
ON commandes
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

#### Policy 3: Admin Only UPDATE/DELETE
```sql
-- Only admins can update/delete orders
CREATE POLICY "Admins can manage orders"
ON commandes
FOR UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

### Table: `commandes_lignes`

**Purpose**: Order line items

#### Policy 1: View Own Order Lines
```sql
-- Users can view lines for their own orders
CREATE POLICY "Users can view own order lines"
ON commandes_lignes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commandes
    WHERE commandes.id = commandes_lignes.commande_id
    AND (
      commandes.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);
```

#### Policy 2: System INSERT (via triggers or admin)
```sql
-- Only system/admin can insert order lines
CREATE POLICY "System can insert order lines"
ON commandes_lignes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

### Table: `visiteurs`

**Purpose**: Visitor tracking

#### Policy 1: Anonymous INSERT (Tracking)
```sql
-- Allow anonymous visitors to insert tracking data
CREATE POLICY "Allow anonymous visitor tracking"
ON visiteurs
FOR INSERT
TO anon
WITH CHECK (true);
```

#### Policy 2: System UPDATE (Tracking Updates)
```sql
-- System can update visitor data (via service role or triggers)
CREATE POLICY "System can update visitors"
ON visiteurs
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
```

#### Policy 3: Admin Only SELECT
```sql
-- Only admins can view visitor data
CREATE POLICY "Admins can view visitors"
ON visiteurs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

#### Policy 4: Admin Only DELETE
```sql
-- Only admins can delete visitor data
CREATE POLICY "Admins can delete visitors"
ON visiteurs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

### Table: `profiles` / `utilisateurs`

**Purpose**: User management

#### Policy 1: Users Can View Own Profile
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

#### Policy 2: Admin Can View All Profiles
```sql
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);
```

#### Policy 3: Admin Only INSERT/UPDATE/DELETE
```sql
-- Only admins can manage profiles
CREATE POLICY "Admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);
```

---

### Table: `leads_notes`

**Purpose**: Notes on leads

#### Policy 1: Authenticated SELECT (Related Leads)
```sql
-- Users can view notes for leads they have access to
CREATE POLICY "Users can view lead notes"
ON leads_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = leads_notes.lead_id
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);
```

#### Policy 2: Authenticated INSERT
```sql
-- Authenticated users can add notes
CREATE POLICY "Authenticated can add notes"
ON leads_notes
FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### Policy 3: Admin Only UPDATE/DELETE
```sql
-- Only admins can modify notes
CREATE POLICY "Admins can manage notes"
ON leads_notes
FOR UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## How to Configure RLS in Supabase

### Step 1: Enable RLS on Tables

1. Go to **Supabase Dashboard** → **Table Editor**
2. Select a table (e.g., `leads`)
3. Click **Settings** (gear icon)
4. Enable **Enable Row Level Security**

Or via SQL:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### Step 2: Create Policies

1. Go to **Supabase Dashboard** → **Authentication** → **Policies**
2. Select the table
3. Click **New Policy**
4. Choose policy type (SELECT, INSERT, UPDATE, DELETE)
5. Copy-paste the SQL from this guide
6. Click **Save**

Or via SQL Editor:

1. Go to **SQL Editor**
2. Copy-paste the policy SQL from this guide
3. Click **Run**

### Step 3: Test Policies

Test with different user roles:

```sql
-- Test as anonymous user
SET ROLE anon;
SELECT * FROM leads; -- Should fail (no policy for anon SELECT)

-- Test as authenticated user
SET ROLE authenticated;
SELECT * FROM leads; -- Should work

-- Test as admin
-- (Use service role key in application)
```

---

## Policy Patterns Explained

### Pattern 1: Anonymous INSERT (Public Forms)
```sql
CREATE POLICY "policy_name"
ON table_name
FOR INSERT
TO anon
WITH CHECK (true);
```
**Use case**: Public forms that don't require authentication

### Pattern 2: Authenticated Only
```sql
CREATE POLICY "policy_name"
ON table_name
FOR SELECT
TO authenticated
USING (true);
```
**Use case**: Require login to view data

### Pattern 3: Admin Only
```sql
CREATE POLICY "policy_name"
ON table_name
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```
**Use case**: Admin-only operations

### Pattern 4: Own Data Only
```sql
CREATE POLICY "policy_name"
ON table_name
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```
**Use case**: Users can only see their own data

---

## Common Issues & Solutions

### Issue 1: "new row violates row-level security policy"

**Cause**: INSERT policy doesn't allow the operation

**Solution**: Check that you have an INSERT policy for the role (anon or authenticated)

### Issue 2: "permission denied for table"

**Cause**: RLS is enabled but no policies exist

**Solution**: Create at least one policy for each operation you need

### Issue 3: Admin can't access data

**Cause**: Policy checks `profiles.role` but user doesn't have profile

**Solution**: Ensure user has a profile record with `role = 'admin'`

---

## Testing Checklist

After configuring RLS, test:

- [ ] Anonymous user can insert leads (form submission)
- [ ] Anonymous user cannot read leads
- [ ] Authenticated user can read leads
- [ ] Admin can update/delete leads
- [ ] Non-admin cannot update/delete leads
- [ ] Public can view active products
- [ ] Admin can manage products
- [ ] Users can only view their own orders
- [ ] Admin can view all orders

---

## Security Best Practices

1. **Always enable RLS** on tables with sensitive data
2. **Test policies** with different user roles
3. **Use least privilege**: Only grant minimum necessary permissions
4. **Audit regularly**: Review policies periodically
5. **Document exceptions**: If you need to bypass RLS, document why
6. **Use service role key carefully**: Only in server-side code, never expose

---

## Service Role Key Usage

The service role key bypasses RLS. Use it only for:
- Server-side operations (API routes, webhooks)
- Admin operations that need full access
- System migrations

**NEVER** expose the service role key in client-side code!

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/reference/javascript/auth-helpers)

---

**Last Updated**: ${new Date().toLocaleDateString('fr-FR')}

**Status**: ⚠️ Policies need to be implemented in Supabase Dashboard

