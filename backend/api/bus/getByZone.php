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
    
    // Récupérer les bus actifs avec leurs trajets
    // Note: La correspondance zone-bus se fait via les trajets qui contiennent les zones
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
        HAVING places_restantes > 0
        ORDER BY b.numero
    ');
    $stmt->execute();
    $allBuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Filtrer les bus qui correspondent à la zone
    // Les zones sont stockées dans trajet_zones au format JSON
    $buses = [];
    foreach ($allBuses as $bus) {
        $trajetZones = json_decode($bus['trajet_zones'], true);
        if (is_array($trajetZones)) {
            // Vérifier si la zone recherchée est dans les zones du trajet
            $zoneFound = false;
            foreach ($trajetZones as $trajetZone) {
                if (stripos($trajetZone, $zone) !== false || stripos($zone, $trajetZone) !== false) {
                    $zoneFound = true;
                    break;
                }
            }
            if ($zoneFound) {
                $buses[] = $bus;
            }
        } else {
            // Si pas de zones définies, inclure tous les bus (fallback)
            $buses[] = $bus;
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $buses,
        'zone' => $zone
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération: ' . $e->getMessage()]);
}
?>

