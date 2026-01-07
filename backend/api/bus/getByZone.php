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
        
        $trajetZones = [];
        $zonesRaw = trim($bus['trajet_zones']);
        
        // Helper pour nettoyer une zone
        $cleanZone = function($z) {
            return trim($z, " \t\n\r\0\x0B\"'[]");
        };

        // Essayer de parser comme JSON d'abord
        $decoded = json_decode($zonesRaw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $trajetZones = array_map($cleanZone, $decoded);
        } else {
            // Fallback: nettoyage manuel pour les formats bâtards (ex: "[\"Zone 1\", \"Zone 2\"]" mal parsé ou "Zone 1, Zone 2")
            $cleaned = trim($zonesRaw, '[]"\'');
            if (strpos($cleaned, ',') !== false) {
                $trajetZones = array_map($cleanZone, explode(',', $cleaned));
            } else {
                $trajetZones = [$cleanZone($cleaned)];
            }
        }
        
        // Normalisation pour comparaison robuste
        $normalize = function($str) {
            $str = mb_strtolower(trim($str), 'UTF-8');
            // Remplacer les accents courants pour une recherche plus souple
            $search  = ['à', 'á', 'â', 'ã', 'ä', 'å', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ù', 'ú', 'û', 'ü', 'ý', 'ÿ'];
            $replace = ['a', 'a', 'a', 'a', 'a', 'a', 'c', 'e', 'e', 'e', 'e', 'i', 'i', 'i', 'i', 'n', 'o', 'o', 'o', 'o', 'o', 'u', 'u', 'u', 'u', 'y', 'y'];
            return str_replace($search, $replace, $str);
        };

        $zoneSearchNorm = $normalize($zoneNormalized);
        
        // Vérifier si la zone recherchée correspond
        $zoneFound = false;
        $matchedZoneName = '';
        
        foreach ($trajetZones as $tz) {
            $tzNorm = $normalize($tz);
            if ($tzNorm === $zoneSearchNorm || strpos($tzNorm, $zoneSearchNorm) !== false || strpos($zoneSearchNorm, $tzNorm) !== false) {
                $zoneFound = true;
                $matchedZoneName = $tz;
                break;
            }
        }
        
        // Stocker TOUS les bus avec leurs zones pour le débogage
        $debugInfo['exemples_trajets_zones'][] = [
            'bus_numero' => $bus['numero'],
            'trajet_nom' => $bus['trajet_nom'],
            'zones' => array_values($trajetZones),
            'zone_match' => $zoneFound,
            'matched_zone' => $matchedZoneName,
            'places_restantes' => intval($bus['places_restantes']),
            'statut' => $bus['statut']
        ];
        
        if ($zoneFound) {
            if (intval($bus['places_restantes']) > 0) {
                $buses[] = $bus;
                $debugInfo['bus_trouves']++;
            } else {
                $debugInfo['bus_pleins']++;
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

