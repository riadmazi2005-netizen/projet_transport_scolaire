-- Migration pour les fonctionnalités chauffeur
-- Tables pour : essence, rapports trajet, checklist, signalements, planning

-- Table prise_essence
CREATE TABLE IF NOT EXISTS prise_essence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    quantite_litres DECIMAL(10,2) NOT NULL,
    prix_total DECIMAL(10,2) NOT NULL,
    kilometrage_actuel INT,
    station_service VARCHAR(255),
    photo_ticket VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur_date (chauffeur_id, date),
    INDEX idx_bus_date (bus_id, date)
);

-- Table rapports_trajet
CREATE TABLE IF NOT EXISTS rapports_trajet (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    date DATE NOT NULL,
    periode ENUM('matin', 'soir') NOT NULL,
    heure_depart_prevue TIME,
    heure_depart_reelle TIME,
    heure_arrivee_prevue TIME,
    heure_arrivee_reelle TIME,
    nombre_eleves INT DEFAULT 0,
    kilometres_parcourus INT,
    problemes TEXT,
    observations TEXT,
    statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur_date (chauffeur_id, date),
    INDEX idx_date_periode (date, periode)
);

-- Table checklist_depart
CREATE TABLE IF NOT EXISTS checklist_depart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    date DATE NOT NULL,
    periode ENUM('matin', 'soir') NOT NULL,
    essence_verifiee BOOLEAN DEFAULT FALSE,
    pneus_ok BOOLEAN DEFAULT FALSE,
    portes_ok BOOLEAN DEFAULT FALSE,
    eclairage_ok BOOLEAN DEFAULT FALSE,
    nettoyage_fait BOOLEAN DEFAULT FALSE,
    trousse_secours BOOLEAN DEFAULT FALSE,
    autres_verifications TEXT,
    validee BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur_date (chauffeur_id, date)
);

-- Table signalements_maintenance
CREATE TABLE IF NOT EXISTS signalements_maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    type_probleme ENUM('mecanique', 'eclairage', 'portes', 'climatisation', 'pneus', 'autre') NOT NULL,
    description TEXT NOT NULL,
    urgence ENUM('faible', 'moyenne', 'haute') DEFAULT 'moyenne',
    photo VARCHAR(255),
    statut ENUM('en_attente', 'en_cours', 'resolu') DEFAULT 'en_attente',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur (chauffeur_id),
    INDEX idx_bus (bus_id),
    INDEX idx_statut (statut)
);

