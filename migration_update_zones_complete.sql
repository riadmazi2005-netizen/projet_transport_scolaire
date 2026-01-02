-- Migration : Mise à jour complète des zones
USE transport_scolaire;

-- Étape 1: Créer la table zones si elle n'existe pas
CREATE TABLE IF NOT EXISTS zones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    ville VARCHAR(100) NOT NULL DEFAULT 'Rabat',
    description TEXT NULL,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_zone_ville (nom, ville)
);

-- Étape 2: Ajouter la colonne 'ville' si elle n'existe pas déjà
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'zones' 
               AND COLUMN_NAME = 'ville');
SET @sqlstmt := IF(@exist > 0, 
    'SELECT ''La colonne ville existe déjà'' AS message',
    'ALTER TABLE zones ADD COLUMN ville VARCHAR(100) NOT NULL DEFAULT ''Rabat'' AFTER nom');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Étape 3: Supprimer toutes les anciennes zones pour recommencer proprement (optionnel)
-- DELETE FROM zones;

-- Étape 4: Insérer les nouvelles zones avec leurs villes
-- Rabat – 8 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Agdal', 'Rabat', TRUE),
('Hassan', 'Rabat', TRUE),
('Hay Riad', 'Rabat', TRUE),
('Yacoub El Mansour', 'Rabat', TRUE),
('Souissi', 'Rabat', TRUE),
('Nahda', 'Rabat', TRUE),
('Akkari', 'Rabat', TRUE),
('Takkadoum', 'Rabat', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville), actif=VALUES(actif);

-- Salé – 8 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Hay Amal', 'Salé', TRUE),
('Hay Karima', 'Salé', TRUE),
('Hay Nbi3at', 'Salé', TRUE),
('Sidi Moussa', 'Salé', TRUE),
('Boulknadel', 'Salé', TRUE),
('Sale Jadida', 'Salé', TRUE),
('Harhoura', 'Salé', TRUE),
('Maamora', 'Salé', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville), actif=VALUES(actif);

-- Temara – 3 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Temara Centre', 'Temara', TRUE),
('Milano', 'Temara', TRUE),
('Harhoura', 'Temara', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville), actif=VALUES(actif);

