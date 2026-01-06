<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$zone = isset($_GET['zone']) ? trim($_GET['zone']) : null;

if (!$zone) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Zone requise']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Normaliser la zone recherchée
    $zoneNormalized = trim($zone);
    
    // Récupérer les bus actifs avec leurs trajets
    // Note: La correspondance zone-bus se fait via les trajets qui contiennent les zones
    // On récupère d'abord tous les bus actifs, puis on filtre par zone
    $stmt = $pdo->prepare('
        SELECT 
            b.*,
            t.nom as trajet_nom,
            t.zones as trajet_zones,
            c.numero_permis,
            r.zone_responsabilite,
            COUNT(DISTINCT i.id) as eleves_inscrits,
            (b.capacite - COUNT(DISTINCT i.id)) as places_restantes
        FROM bus b
        LEFT JOIN trajets t ON b.trajet_id = t.id
        LEFT JOIN chauffeurs c ON b.chauffeur_id = c.id
        LEFT JOIN responsables_bus r ON b.responsable_id = r.id
        LEFT JOIN inscriptions i ON i.bus_id = b.id AND i.statut = "Active"
        WHERE b.statut = "Actif"
        GROUP BY b.id
        ORDER BY b.numero
    ');
    $stmt->execute();
    $allBuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Filtrer les bus qui correspondent exactement à la zone
    // Les zones sont stockées dans trajet_zones au format JSON ou comme chaîne séparée par des virgules
    $buses = [];
    $debugInfo = [
        'zone_recherchee' => $zoneNormalized,
        'total_bus_actifs' => count($allBuses),
        'bus_sans_trajet' => 0,
        'bus_trajets_vides' => 0,
        'bus_zones_non_match' => 0,
        'bus_pleins' => 0,
        'bus_trouves' => 0,
        'exemples_trajets_zones' => []
    ];
    
    foreach ($allBuses as $bus) {
        // Si le bus n'a pas de trajet, on l'exclut
        if (!$bus['trajet_id']) {
            $debugInfo['bus_sans_trajet']++;
            continue;
        }
        
        if (!$bus['trajet_zones'] || trim($bus['trajet_zones']) === '') {
            $debugInfo['bus_trajets_vides']++;
            continue;
        }
        
        $trajetZones = null;
        $zonesRaw = trim($bus['trajet_zones']);
        
        // Essayer de parser comme JSON d'abord
        $decoded = json_decode($zonesRaw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            // C'est un array JSON valide
            $trajetZones = array_map('trim', $decoded); // Nettoyer les espaces
        } else {
            // Essayer de parser comme JSON avec des guillemets simples ou doubles
            // Parfois le JSON est malformé avec des espaces ou des guillemets supplémentaires
            $cleaned = trim($zonesRaw, '[]"\'');
            if (strpos($cleaned, ',') !== false) {
                // C'est probablement une liste séparée par des virgules
                $trajetZones = array_map('trim', explode(',', $cleaned));
            } else {
                // Une seule zone
                $trajetZones = [trim($cleaned)];
            }
        }
        
        // Nettoyer et normaliser toutes les zones
        $trajetZones = array_filter(array_map(function($z) {
            $cleaned = trim($z, ' "\'[]');
            return $cleaned;
        }, $trajetZones));
        
        // Vérifier si la zone recherchée correspond exactement à une des zones du trajet
        $zoneFound = false;
        $zoneSearchLower = mb_strtolower(trim($zoneNormalized), 'UTF-8');
        
        if (is_array($trajetZones) && count($trajetZones) > 0) {
            foreach ($trajetZones as $trajetZone) {
                $trajetZoneCleaned = trim($trajetZone, ' "\'[]');
                $trajetZoneLower = mb_strtolower($trajetZoneCleaned, 'UTF-8');
                
                // Correspondance exacte après normalisation
                if ($trajetZoneLower === $zoneSearchLower) {
                    $zoneFound = true;
                    break;
                }
            }
        }
        
        // Stocker TOUS les bus avec leurs zones pour le débogage
        $debugInfo['exemples_trajets_zones'][] = [
            'bus_numero' => $bus['numero'],
            'trajet_nom' => $bus['trajet_nom'],
            'trajet_id' => $bus['trajet_id'],
            'zones' => array_values($trajetZones), // Réindexer l'array
            'zones_raw' => $bus['trajet_zones'],
            'places_restantes' => $bus['places_restantes'],
            'zone_match' => $zoneFound,
            'zone_recherchee' => $zoneNormalized,
            'zone_search_lower' => $zoneSearchLower
        ];
        
        // Ne garder que les bus dont le trajet contient exactement la zone recherchée
        // ET qui ont des places restantes
        if ($zoneFound) {
            if ($bus['places_restantes'] > 0) {
                $buses[] = $bus;
                $debugInfo['bus_trouves']++;
            } else {
                $debugInfo['bus_pleins'] = ($debugInfo['bus_pleins'] ?? 0) + 1;
            }
        } else {
            $debugInfo['bus_zones_non_match']++;
        }
    }
    
    // Toujours retourner success: true pour que les informations de débogage soient disponibles
    // Le frontend vérifiera si data.length > 0 pour savoir s'il y a des bus disponibles
    echo json_encode([
        'success' => true,
        'data' => $buses,
        'zone' => $zone,
        'message' => count($buses) === 0 ? 'Aucun bus disponible pour cette zone' : count($buses) . ' bus disponible(s)',
        'debug' => $debugInfo
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération: ' . $e->getMessage()]);
}
?>

