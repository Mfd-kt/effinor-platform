-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'gray',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on nom for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_nom ON roles(nom);

-- Insert default system roles
INSERT INTO roles (nom, label, color, permissions, is_system, description) VALUES
('admin', 'Administrateur', 'red', '["all"]'::jsonb, true, 'Accès total à toutes les fonctionnalités'),
('commercial', 'Commercial', 'blue', '["leads.view", "leads.create", "leads.edit", "devis.view", "devis.create", "devis.edit", "commandes.view", "clients.view", "clients.create", "clients.edit"]'::jsonb, true, 'Gestion des leads, devis, commandes et clients'),
('technicien', 'Technicien', 'green', '["commandes.view", "commandes.edit", "produits.view", "installation.view"]'::jsonb, true, 'Gestion des commandes et installations'),
('comptable', 'Comptable', 'yellow', '["factures.view", "factures.create", "factures.edit", "devis.view", "commandes.view", "rapports.view", "rapports.export"]'::jsonb, true, 'Gestion des factures et rapports financiers'),
('lecture', 'Lecture seule', 'gray', '["dashboard", "*.view"]'::jsonb, true, 'Accès en lecture seule à toutes les données')
ON CONFLICT (nom) DO NOTHING;

-- Update utilisateurs table to reference roles
-- Note: If role column already exists as TEXT, we keep it for backward compatibility
-- The role field should contain the role.nom (slug)

-- Enable RLS on roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view roles
CREATE POLICY "Authenticated users can view roles"
ON roles
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles"
ON roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role = 'admin'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_roles_updated_at ON roles;
CREATE TRIGGER trigger_update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_roles_updated_at();




























