<?php
/**
 * Script de test pour vérifier les bus disponibles pour une zone
 * Usage: GET /api/bus/testZone.php?zone=Agdal
 */
require_once '../../config/headers.php';
require_once '../../config/database.php';

$zone = isset($_GET['zone']) ? trim($_GET['zone']) : 'Agdal';

try {
    $pdo = getDBConnection();
    
    echo "<h2>Test de recherche de bus pour la zone: <strong>$zone</strong></h2>";
    
    // 1. Récupérer tous les bus actifs
    $stmt = $pdo->prepare('
        SELECT 
            b.id,
            b.numero,
            b.statut,
            b.trajet_id,
            t.nom as trajet_nom,
            t.zones as trajet_zones,
            COUNT(DISTINCT i.id) as eleves_inscrits,
            b.capacite,
            (b.capacite - COUNT(DISTINCT i.id)) as places_restantes
        FROM bus b
        LEFT JOIN trajets t ON b.trajet_id = t.id
        LEFT JOIN inscriptions i ON i.bus_id = b.id AND i.statut = "Active"
        WHERE b.statut = "Actif"
        GROUP BY b.id
        ORDER BY b.numero
    ');
    $stmt->execute();
    $allBuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>1. Tous les bus actifs (" . count($allBuses) . "):</h3>";
    echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
    echo "<tr><th>Bus</th><th>Statut</th><th>Trajet ID</th><th>Trajet Nom</th><th>Zones (raw)</th><th>Capacité</th><th>Élèves</th><th>Places</th></tr>";
    
    foreach ($allBuses as $bus) {
        $zonesRaw = $bus['trajet_zones'] ? htmlspecialchars($bus['trajet_zones']) : 'NULL';
        echo "<tr>";
        echo "<td>{$bus['numero']}</td>";
        echo "<td>{$bus['statut']}</td>";
        echo "<td>" . ($bus['trajet_id'] ? $bus['trajet_id'] : 'NULL') . "</td>";
        echo "<td>" . ($bus['trajet_nom'] ? htmlspecialchars($bus['trajet_nom']) : 'NULL') . "</td>";
        echo "<td style='max-width: 300px; word-wrap: break-word;'>{$zonesRaw}</td>";
        echo "<td>{$bus['capacite']}</td>";
        echo "<td>{$bus['eleves_inscrits']}</td>";
        echo "<td>{$bus['places_restantes']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 2. Analyser les zones
    echo "<h3>2. Analyse des zones:</h3>";
    $zoneNormalized = trim($zone);
    $zoneLower = mb_strtolower($zoneNormalized, 'UTF-8');
    
    echo "<p>Zone recherchée: <strong>$zoneNormalized</strong> (normalisée: <strong>$zoneLower</strong>)</p>";
    
    $busesFound = [];
    $busesWithoutTrajet = 0;
    $busesWithEmptyZones = 0;
    $busesZonesNoMatch = 0;
    $busesFull = 0;
    
    foreach ($allBuses as $bus) {
        if (!$bus['trajet_id']) {
            $busesWithoutTrajet++;
            continue;
        }
        
        if (!$bus['trajet_zones'] || trim($bus['trajet_zones']) === '') {
            $busesWithEmptyZones++;
            continue;
        }
        
        // Parser les zones avec la même logique que getByZone.php
        $zonesRaw = trim($bus['trajet_zones']);
        $trajetZones = null;
        
        // Essayer de parser comme JSON d'abord
        $decoded = json_decode($zonesRaw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            // C'est un array JSON valide
            $trajetZones = array_map('trim', $decoded);
        } else {
            // Essayer de parser comme JSON avec des guillemets simples ou doubles
            $cleaned = trim($zonesRaw, '[]"\'');
            if (strpos($cleaned, ',') !== false) {
                $trajetZones = array_map('trim', explode(',', $cleaned));
            } else {
                $trajetZones = [trim($cleaned)];
            }
        }
        
        // Nettoyer et normaliser toutes les zones
        $trajetZones = array_filter(array_map(function($z) {
            $cleaned = trim($z, ' "\'[]');
            return $cleaned;
        }, $trajetZones));
        
        // Vérifier la correspondance
        $zoneFound = false;
        if (is_array($trajetZones) && count($trajetZones) > 0) {
            foreach ($trajetZones as $trajetZone) {
                $trajetZoneNormalized = trim($trajetZone);
                $trajetZoneLower = mb_strtolower($trajetZoneNormalized, 'UTF-8');
                
                if ($trajetZoneLower === $zoneLower) {
                    $zoneFound = true;
                    break;
                }
            }
        }
        
        if ($zoneFound) {
            if ($bus['places_restantes'] > 0) {
                $busesFound[] = $bus;
            } else {
                $busesFull++;
            }
        } else {
            $busesZonesNoMatch++;
        }
    }
    
    echo "<h3>3. Résultats:</h3>";
    echo "<ul>";
    echo "<li>Bus sans trajet: <strong>$busesWithoutTrajet</strong></li>";
    echo "<li>Trajets sans zones: <strong>$busesWithEmptyZones</strong></li>";
    echo "<li>Bus avec zones ne correspondant pas: <strong>$busesZonesNoMatch</strong></li>";
    echo "<li>Bus trouvés mais pleins: <strong>$busesFull</strong></li>";
    echo "<li>Bus disponibles: <strong>" . count($busesFound) . "</strong></li>";
    echo "</ul>";
    
    if (count($busesFound) > 0) {
        echo "<h3>4. Bus disponibles pour la zone '$zone':</h3>";
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>Bus</th><th>Trajet</th><th>Zones</th><th>Places</th></tr>";
        foreach ($busesFound as $bus) {
            $trajetZones = json_decode($bus['trajet_zones'], true);
            if (!is_array($trajetZones)) {
                $trajetZones = explode(',', $bus['trajet_zones']);
            }
            $zonesStr = implode(', ', array_map('trim', $trajetZones));
            echo "<tr>";
            echo "<td>{$bus['numero']}</td>";
            echo "<td>{$bus['trajet_nom']}</td>";
            echo "<td>$zonesStr</td>";
            echo "<td>{$bus['places_restantes']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<h3>4. Aucun bus disponible</h3>";
        echo "<p style='color: red;'>Aucun bus avec des places disponibles n'a été trouvé pour la zone '$zone'.</p>";
    }
    
    // 5. Afficher tous les trajets et leurs zones pour référence
    echo "<h3>5. Tous les trajets et leurs zones (pour référence):</h3>";
    $stmt = $pdo->prepare('SELECT id, nom, zones FROM trajets ORDER BY nom');
    $stmt->execute();
    $allTrajets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Nom</th><th>Zones (raw)</th><th>Zones (parsed)</th></tr>";
    foreach ($allTrajets as $trajet) {
        $zonesRaw = $trajet['zones'] ? htmlspecialchars($trajet['zones']) : 'NULL';
        $zonesParsed = 'NULL';
        if ($trajet['zones']) {
            $decoded = json_decode($trajet['zones'], true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $zonesParsed = implode(', ', $decoded);
            } else {
                $zonesParsed = $trajet['zones'];
            }
        }
        echo "<tr>";
        echo "<td>{$trajet['id']}</td>";
        echo "<td>" . htmlspecialchars($trajet['nom']) . "</td>";
        echo "<td style='max-width: 300px; word-wrap: break-word;'>{$zonesRaw}</td>";
        echo "<td>$zonesParsed</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Erreur: " . htmlspecialchars($e->getMessage()) . "</p>";
}



