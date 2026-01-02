-- Migration : Créer la table zones
USE transport_scolaire;

-- Table zones
CREATE TABLE IF NOT EXISTS zones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    description TEXT NULL,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_zone_ville (nom, ville)
);

-- Si la table existe déjà, ajouter la colonne ville si elle n'existe pas
ALTER TABLE zones ADD COLUMN IF NOT EXISTS ville VARCHAR(100) NOT NULL DEFAULT 'Rabat' AFTER nom;

-- Insérer les zones avec leurs villes
-- Rabat – 6 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Agdal', 'Rabat', TRUE),
('Hassan', 'Rabat', TRUE),
('Hay Riad', 'Rabat', TRUE),
('Yacoub El Mansour', 'Rabat', TRUE),
('Souissi', 'Rabat', TRUE),
('Medina', 'Rabat', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville);

-- Salé – 5 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Hay Al Amal', 'Salé', TRUE),
('Sidi Moussa', 'Salé', TRUE),
('Hay Karima', 'Salé', TRUE),
('Hay Essalam', 'Salé', TRUE),
('Hay Nbi3at', 'Salé', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville);

-- Temara – 4 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Temara Centre', 'Temara', TRUE),
('Al Wifa9', 'Temara', TRUE),
('Milano', 'Temara', TRUE),
('Harhoura', 'Temara', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville);

