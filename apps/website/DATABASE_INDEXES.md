# Recommended Database Indexes for Supabase

This document lists the recommended indexes for optimal database performance in the ECPS/Effinor application.

## Why Indexes Matter

Indexes improve query performance by allowing the database to quickly locate rows without scanning the entire table. They are especially important for:
- Frequently queried columns
- Columns used in WHERE clauses
- Columns used for sorting (ORDER BY)
- Foreign key relationships

## How to Create Indexes in Supabase

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL commands below
4. Click **Run** to execute

### Method 2: Supabase CLI

```bash
supabase db push
```

---

## Recommended Indexes

### Table: `leads`

These indexes optimize lead queries, filtering, and sorting:

```sql
-- Index for sorting by creation date (most common query)
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_leads_statut ON leads(statut);

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Index for searching by email
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_leads_statut_created_at ON leads(statut, created_at DESC);
```

**Usage**: These indexes speed up:
- Admin leads list (sorted by date)
- Filtering leads by status
- Searching leads by email
- Filtering by source

---

### Table: `products`

These indexes optimize product catalog queries:

```sql
-- Index for filtering active products
CREATE INDEX IF NOT EXISTS idx_products_actif ON products(actif);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_products_categorie ON products(categorie);

-- Index for product detail lookup by slug
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Index for ordering products
CREATE INDEX IF NOT EXISTS idx_products_ordre ON products(ordre);

-- Composite index for active products by category
CREATE INDEX IF NOT EXISTS idx_products_actif_categorie ON products(actif, categorie) WHERE actif = true;
```

**Usage**: These indexes speed up:
- Public product catalog (filtered by actif)
- Category filtering
- Product detail page (slug lookup)
- Admin product list (ordered by ordre)

---

### Table: `commandes`

These indexes optimize order queries:

```sql
-- Index for sorting orders by date
CREATE INDEX IF NOT EXISTS idx_commandes_date_creation ON commandes(date_creation DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);

-- Index for searching by email
CREATE INDEX IF NOT EXISTS idx_commandes_email ON commandes(email);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_commandes_statut_date ON commandes(statut, date_creation DESC);
```

**Usage**: These indexes speed up:
- Admin orders list (sorted by date)
- Filtering orders by status
- Searching orders by customer email

---

### Table: `commandes_lignes`

These indexes optimize order line queries:

```sql
-- Index for fetching lines by order
CREATE INDEX IF NOT EXISTS idx_commandes_lignes_commande_id ON commandes_lignes(commande_id);

-- Index for product lookup
CREATE INDEX IF NOT EXISTS idx_commandes_lignes_produit_id ON commandes_lignes(produit_id);
```

**Usage**: These indexes speed up:
- Loading order details (all lines for an order)
- Product order history

---

### Table: `visiteurs`

These indexes optimize visitor tracking queries:

```sql
-- Index for sorting by last seen
CREATE INDEX IF NOT EXISTS idx_visiteurs_last_seen ON visiteurs(last_seen DESC);

-- Index for filtering active visitors
CREATE INDEX IF NOT EXISTS idx_visiteurs_statut ON visiteurs(statut);

-- Composite index for active visitors
CREATE INDEX IF NOT EXISTS idx_visiteurs_statut_last_seen ON visiteurs(statut, last_seen DESC) WHERE statut = 'active';
```

**Usage**: These indexes speed up:
- Admin visitor dashboard
- Active visitor queries
- Visitor analytics

---

### Table: `utilisateurs` / `profiles`

These indexes optimize user queries:

```sql
-- Index for email lookup (authentication)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active) WHERE active = true;
```

**Usage**: These indexes speed up:
- User authentication
- Admin user list filtering
- Role-based queries

---

### Table: `leads_notes`

These indexes optimize note queries:

```sql
-- Index for fetching notes by lead
CREATE INDEX IF NOT EXISTS idx_leads_notes_lead_id ON leads_notes(lead_id);

-- Index for sorting notes by date
CREATE INDEX IF NOT EXISTS idx_leads_notes_created_at ON leads_notes(created_at DESC);

-- Composite index for lead timeline
CREATE INDEX IF NOT EXISTS idx_leads_notes_lead_created ON leads_notes(lead_id, created_at DESC);
```

**Usage**: These indexes speed up:
- Loading lead timeline
- Lead detail page notes

---

## Index Maintenance

### Check Existing Indexes

To see all indexes in your database:

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Monitor Index Usage

To check if indexes are being used:

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Drop Unused Indexes

If an index is never used (idx_scan = 0), you can drop it:

```sql
DROP INDEX IF EXISTS idx_name;
```

---

## Performance Tips

1. **Don't over-index**: Too many indexes slow down INSERT/UPDATE operations
2. **Monitor usage**: Regularly check which indexes are actually used
3. **Composite indexes**: Use for common filter combinations
4. **Partial indexes**: Use WHERE clauses for filtered indexes (e.g., active products only)
5. **Regular maintenance**: Run VACUUM ANALYZE periodically

---

## Verification

After creating indexes, verify they exist:

```sql
-- Check indexes for a specific table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'leads';
```

---

## Notes

- Indexes are automatically maintained by PostgreSQL
- Index creation may take a few seconds for large tables
- Indexes use additional storage space (usually minimal)
- Supabase automatically creates indexes for primary keys and foreign keys

---

**Last Updated**: ${new Date().toLocaleDateString('fr-FR')}

