# Méthodologie d'Intégration GPS dans le Système de Transport Scolaire

## 📍 Vue d'ensemble

Ce document présente une méthodologie complète pour intégrer un système de tracking GPS permettant de suivre en temps réel la localisation des bus scolaires.

---

## 🎯 Objectifs

1. **Tracking en temps réel** : Suivre la position GPS des bus en mouvement
2. **Visualisation sur carte** : Afficher les bus sur une carte interactive
3. **Historique des trajets** : Enregistrer les parcours effectués
4. **Notifications** : Alertes en cas de retards ou d'anomalies
5. **Géofencing** : Détection d'arrivée aux arrêts et écoles

---

## 🏗️ Architecture Technique

### Option 1 : Google Maps Platform (Recommandé)
**Avantages :**
- API mature et bien documentée
- Interface utilisateur professionnelle
- Géocodage et routage intégrés
- Bonne performance

**Inconvénients :**
- Coûts après quota gratuit (200$ crédit/mois)
- Nécessite une clé API

### Option 2 : OpenStreetMap + Leaflet (Open Source)
**Avantages :**
- Gratuit et open source
- Pas de limites d'utilisation
- Personnalisable

**Inconvénients :**
- Nécessite plus de configuration
- Interface moins "prête à l'emploi"

### Option 3 : Mapbox
**Avantages :**
- Interface moderne et personnalisable
- Bonne documentation
- Quota gratuit généreux

**Inconvénients :**
- Coûts après quota
- Courbe d'apprentissage modérée

---

## 📊 Structure de Base de Données

### Table `gps_positions`
```sql
CREATE TABLE gps_positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bus_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    vitesse DECIMAL(5, 2) DEFAULT 0, -- en km/h
    direction DECIMAL(5, 2) DEFAULT 0, -- en degrés (0-360)
    precision_gps DECIMAL(5, 2), -- précision en mètres
    timestamp DATETIME NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_bus_timestamp (bus_id, timestamp),
    INDEX idx_timestamp (timestamp)
);
```

### Table `gps_historique_trajets`
```sql
CREATE TABLE gps_historique_trajets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bus_id INT NOT NULL,
    trajet_id INT,
    date_trajet DATE NOT NULL,
    heure_debut DATETIME,
    heure_fin DATETIME,
    distance_totale DECIMAL(10, 2), -- en km
    duree_totale INT, -- en minutes
    statut ENUM('En cours', 'Terminé', 'Interrompu') DEFAULT 'En cours',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE SET NULL,
    INDEX idx_bus_date (bus_id, date_trajet)
);
```

### Modification de la table `bus`
```sql
ALTER TABLE bus 
ADD COLUMN device_gps_id VARCHAR(100) NULL COMMENT 'ID du dispositif GPS/tracker',
ADD COLUMN derniere_position_lat DECIMAL(10, 8) NULL,
ADD COLUMN derniere_position_lng DECIMAL(11, 8) NULL,
ADD COLUMN derniere_position_timestamp DATETIME NULL,
ADD COLUMN gps_actif BOOLEAN DEFAULT FALSE;
```

---

## 🔄 Flux de Données

### 1. Réception des Positions GPS

```
Dispositif GPS → API Backend → Base de Données
                     ↓
              WebSocket/SSE → Frontend (Carte)
```

### 2. Options pour Recevoir les Données GPS

#### Option A : API REST (Recommandé pour débuter)
- Le dispositif GPS envoie des requêtes POST périodiques
- Format JSON : `{bus_id, latitude, longitude, vitesse, timestamp}`
- Intervalle : Toutes les 30-60 secondes en mouvement

#### Option B : WebSocket Bidirectionnel
- Connexion persistante entre dispositif et serveur
- Envoi continu des positions
- Plus efficace pour le temps réel

#### Option C : MQTT (Pour IoT)
- Protocole léger pour IoT
- Idéal pour plusieurs dispositifs
- Nécessite un broker MQTT (Mosquitto)

---

## 🛠️ Implémentation Étape par Étape

### Phase 1 : Préparation (Semaine 1)

#### 1.1 Choix de la Solution
- [ ] Décider entre Google Maps / OpenStreetMap / Mapbox
- [ ] Créer compte et obtenir clé API (si nécessaire)
- [ ] Installer dépendances frontend

**Dépendances Frontend (React) :**
```bash
# Pour Google Maps
npm install @react-google-maps/api

# Pour Leaflet (OpenStreetMap)
npm install leaflet react-leaflet
npm install @types/leaflet --save-dev

# Pour Mapbox
npm install mapbox-gl react-map-gl
```

#### 1.2 Structure de Base de Données
- [ ] Créer les tables `gps_positions` et `gps_historique_trajets`
- [ ] Modifier la table `bus` avec les nouveaux champs
- [ ] Créer les index pour optimiser les requêtes

### Phase 2 : Backend API (Semaine 2)

#### 2.1 Endpoint pour Recevoir Positions GPS
**Fichier : `backend/api/gps/position.php`**
```php
// POST /api/gps/position.php
// Reçoit : {bus_id, latitude, longitude, vitesse?, direction?, timestamp}
// Sauvegarde dans gps_positions
// Met à jour bus.derniere_position_*
```

#### 2.2 Endpoint pour Récupérer Positions Actuelles
**Fichier : `backend/api/gps/getCurrent.php`**
```php
// GET /api/gps/getCurrent.php?bus_id=X
// Retourne la dernière position d'un bus
```

#### 2.3 Endpoint pour Positions de Tous les Bus
**Fichier : `backend/api/gps/getAllCurrent.php`**
```php
// GET /api/gps/getAllCurrent.php
// Retourne les dernières positions de tous les bus actifs
```

#### 2.4 Endpoint pour Historique
**Fichier : `backend/api/gps/getHistory.php`**
```php
// GET /api/gps/getHistory.php?bus_id=X&date=YYYY-MM-DD
// Retourne toutes les positions d'un bus pour une date
```

#### 2.5 WebSocket/SSE pour Temps Réel (Optionnel)
**Fichier : `backend/api/gps/stream.php`**
- Server-Sent Events (SSE) pour push des mises à jour
- Ou WebSocket avec Ratchet (PHP) / Socket.io (Node.js)

### Phase 3 : Frontend - Carte Interactive (Semaine 3)

#### 3.1 Composant Carte Principale
**Fichier : `src/components/GPSMap.jsx`**
- Affiche la carte (Google Maps / Leaflet)
- Affiche les marqueurs des bus
- Actualisation automatique (toutes les 30 secondes)

#### 3.2 Composant Marqueur Bus
- Icône personnalisée pour chaque bus
- Popup avec informations : numéro bus, chauffeur, nombre d'élèves
- Couleur selon statut (En route, Arrêté, En retard)

#### 3.3 Page Admin - Vue GPS
**Fichier : `src/pages/AdminGPS.jsx`**
- Carte avec tous les bus
- Filtres : par bus, par statut
- Vue liste en complément

#### 3.4 Page Tuteur - Suivi du Bus
**Fichier : `src/pages/TuteurGPS.jsx`**
- Carte avec le bus de l'enfant
- ETA (Estimated Time of Arrival)
- Notification "Bus proche"

### Phase 4 : Fonctionnalités Avancées (Semaine 4)

#### 4.1 Géofencing
- Détection arrivée aux arrêts
- Détection arrivée à l'école
- Notifications automatiques

#### 4.2 Historique et Rapports
- Visualisation des trajets passés
- Statistiques : temps moyen, distance, vitesse moyenne
- Export des données

#### 4.3 Alertes et Notifications
- Bus en retard (> 10 minutes)
- Bus hors trajet prévu
- Vitesse excessive
- Arrêt anormalement long

### Phase 5 : Intégration Dispositifs GPS (Semaine 5)

#### 5.1 Configuration Dispositifs
- Associer device_id à bus_id
- Configuration de l'intervalle d'envoi
- Test de connexion

#### 5.2 Simulation (Pour Tests)
**Fichier : `backend/simulate_gps.php`**
- Script de simulation pour tester sans dispositif réel
- Génère des positions le long d'un trajet

---

## 💻 Exemple de Code

### Backend - Réception Position GPS

**Fichier : `backend/api/gps/position.php`**
```php
<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validation
if (!isset($data['bus_id']) || !isset($data['latitude']) || !isset($data['longitude'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Insérer la position
    $stmt = $pdo->prepare('
        INSERT INTO gps_positions (bus_id, latitude, longitude, vitesse, direction, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['bus_id'],
        $data['latitude'],
        $data['longitude'],
        $data['vitesse'] ?? 0,
        $data['direction'] ?? 0,
        $data['timestamp'] ?? date('Y-m-d H:i:s')
    ]);
    
    // Mettre à jour la dernière position dans la table bus
    $stmt = $pdo->prepare('
        UPDATE bus 
        SET derniere_position_lat = ?,
            derniere_position_lng = ?,
            derniere_position_timestamp = ?,
            gps_actif = TRUE
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['latitude'],
        $data['longitude'],
        $data['timestamp'] ?? date('Y-m-d H:i:s'),
        $data['bus_id']
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Position enregistrée']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>
```

### Frontend - Composant Carte (Google Maps)

**Fichier : `src/components/GPSMap.jsx`**
```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '600px'
};

export default function GPSMap({ busId = null }) {
  const [positions, setPositions] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [center, setCenter] = useState({ lat: 33.9716, lng: -6.8498 }); // Rabat

  useEffect(() => {
    loadPositions();
    const interval = setInterval(loadPositions, 30000); // Actualiser toutes les 30s
    return () => clearInterval(interval);
  }, [busId]);

  const loadPositions = async () => {
    try {
      const url = busId 
        ? `/api/gps/getCurrent.php?bus_id=${busId}`
        : '/api/gps/getAllCurrent.php';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPositions(Array.isArray(data.data) ? data.data : [data.data]);
        if (data.data.length > 0) {
          setCenter({
            lat: parseFloat(data.data[0].latitude),
            lng: parseFloat(data.data[0].longitude)
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement positions:', error);
    }
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
      >
        {positions.map((pos) => (
          <Marker
            key={pos.bus_id}
            position={{
              lat: parseFloat(pos.latitude),
              lng: parseFloat(pos.longitude)
            }}
            onClick={() => setSelectedBus(pos)}
            icon={{
              url: '/bus-icon.png',
              scaledSize: { width: 40, height: 40 }
            }}
          />
        ))}
        
        {selectedBus && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedBus.latitude),
              lng: parseFloat(selectedBus.longitude)
            }}
            onCloseClick={() => setSelectedBus(null)}
          >
            <div>
              <h3>Bus #{selectedBus.bus_numero}</h3>
              <p>Vitesse: {selectedBus.vitesse} km/h</p>
              <p>Dernière mise à jour: {new Date(selectedBus.timestamp).toLocaleString()}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}
```

### Frontend - API Service

**Ajout dans `src/services/apiService.js` :**
```javascript
export const gpsAPI = {
  getCurrent: (busId) => fetchAPI(`/gps/getCurrent.php?bus_id=${busId}`),
  getAllCurrent: () => fetchAPI('/gps/getAllCurrent.php'),
  getHistory: (busId, date) => fetchAPI(`/gps/getHistory.php?bus_id=${busId}&date=${date}`),
  sendPosition: (data) => fetchAPI('/gps/position.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
```

---

## 🔐 Sécurité

### Authentification des Dispositifs GPS
```php
// Token d'authentification pour les dispositifs
ALTER TABLE bus ADD COLUMN gps_token VARCHAR(255) UNIQUE;

// Vérifier le token dans position.php
if (!verifyGPSToken($data['token'], $data['bus_id'])) {
    http_response_code(401);
    exit;
}
```

### Validation des Données
- Vérifier que latitude/longitude sont dans des plages valides
- Limiter la fréquence d'envoi (rate limiting)
- Sanitizer les entrées

---

## 📱 Options de Dispositifs GPS

### 1. Trackers GPS Dédiés
- **Exemples** : TK103, GT06, TkStar
- **Prix** : 20-50€ par unité
- **Communication** : GSM/GPRS
- **Avantages** : Étanches, batterie longue durée, économiques

### 2. Applications Smartphone
- Utiliser l'application du chauffeur
- Géolocalisation HTML5
- Envoi périodique des positions
- **Avantages** : Pas de coût matériel supplémentaire

### 3. OBD-II Trackers (pour bus équipés)
- Se connecte au port OBD-II
- Données GPS + diagnostics véhicule
- **Prix** : 50-150€

---

## 🎯 Fonctionnalités Futures (Phase 2)

1. **Prédiction d'Arrivée** : Algorithmes ML pour prédire l'ETA
2. **Optimisation de Trajets** : Suggérer le meilleur itinéraire
3. **Analyse de Conduite** : Détection de conduite agressive
4. **Intégration Parent** : Notifications push quand le bus approche
5. **Dashboard Analytics** : Graphiques de performance, retards, etc.

---

## 📋 Checklist d'Implémentation

### Semaine 1 : Setup
- [ ] Choisir la solution de carte (Google Maps recommandé)
- [ ] Créer compte et obtenir clé API
- [ ] Créer les tables de base de données
- [ ] Installer les dépendances frontend

### Semaine 2 : Backend
- [ ] Créer endpoint `position.php`
- [ ] Créer endpoint `getCurrent.php`
- [ ] Créer endpoint `getAllCurrent.php`
- [ ] Créer endpoint `getHistory.php`
- [ ] Tests avec données simulées

### Semaine 3 : Frontend
- [ ] Créer composant `GPSMap`
- [ ] Créer page `AdminGPS`
- [ ] Créer page `TuteurGPS`
- [ ] Intégrer dans le menu admin

### Semaine 4 : Fonctionnalités
- [ ] Implémenter géofencing
- [ ] Système d'alertes
- [ ] Historique et rapports
- [ ] Tests end-to-end

### Semaine 5 : Intégration
- [ ] Configurer dispositifs GPS réels
- [ ] Tests en conditions réelles
- [ ] Documentation utilisateur
- [ ] Formation équipe

---

## 💰 Estimation des Coûts

### Google Maps Platform
- **Quota gratuit** : 200$ de crédit/mois
- **Prix** : 
  - Maps JavaScript API : 7$ par 1000 chargements
  - Geocoding API : 5$ par 1000 requêtes
- **Estimation mensuelle** : 0-50$ selon utilisation

### OpenStreetMap (Leaflet)
- **Coût** : Gratuit
- **Hébergement tuiles** : Optionnel (gratuit avec Mapbox ou TileServer)

### Dispositifs GPS
- **Hardware** : 20-50€ par bus
- **SIM/data** : 2-5€/mois par bus (selon opérateur)

---

## 🚀 Recommandation Finale

**Approche Recommandée pour Débuter :**

1. **Phase 1 (MVP)** : 
   - OpenStreetMap + Leaflet (gratuit)
   - Positions simulées depuis l'application chauffeur
   - Carte basique avec marqueurs

2. **Phase 2 (Production)** :
   - Migration vers Google Maps (si budget)
   - Trackers GPS dédiés
   - Géofencing et alertes

3. **Phase 3 (Avancé)** :
   - WebSocket pour temps réel
   - Prédictions et analytics
   - Application mobile dédiée

---

## 📞 Support et Ressources

- **Google Maps Platform** : https://developers.google.com/maps
- **Leaflet Documentation** : https://leafletjs.com/
- **Mapbox Documentation** : https://docs.mapbox.com/
- **React Google Maps** : https://react-google-maps-api-docs.netlify.app/

---

**Note** : Cette méthodologie est modulaire. Vous pouvez commencer avec une version simple et ajouter des fonctionnalités progressivement.

