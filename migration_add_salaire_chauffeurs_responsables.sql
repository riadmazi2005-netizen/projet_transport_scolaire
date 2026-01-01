-- Migration pour ajouter la colonne salaire aux tables chauffeurs et responsables_bus

-- Ajouter salaire aux chauffeurs
ALTER TABLE chauffeurs 
ADD COLUMN IF NOT EXISTS salaire DECIMAL(10,2) DEFAULT 0 NULL;

-- Ajouter salaire aux responsables_bus
ALTER TABLE responsables_bus 
ADD COLUMN IF NOT EXISTS salaire DECIMAL(10,2) DEFAULT 0 NULL;

