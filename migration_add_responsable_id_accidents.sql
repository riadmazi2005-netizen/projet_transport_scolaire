-- Migration: Ajouter le champ responsable_id à la table accidents
-- Date: 2024

ALTER TABLE accidents 
ADD COLUMN responsable_id INT NULL COMMENT 'ID du responsable qui a déclaré l''accident',
ADD FOREIGN KEY (responsable_id) REFERENCES responsables_bus(id) ON DELETE SET NULL;

