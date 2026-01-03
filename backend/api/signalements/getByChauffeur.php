<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$chauffeur_id = $_GET['chauffeur_id'] ?? null;

if (!$chauffeur_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'chauffeur_id requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('
        SELECT * FROM signalements_maintenance 
        WHERE chauffeur_id = ? 
        ORDER BY date_creation DESC
    ');
    $stmt->execute([$chauffeur_id]);
    $signalements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les photos pour chaque signalement
    foreach ($signalements as &$signalement) {
        if (isset($signalement['photos']) && $signalement['photos'] && $signalement['photos'] !== 'null') {
            // Si c'est déjà un tableau (cas où json_decode a déjà été fait)
            if (is_array($signalement['photos'])) {
                // Déjà décodé, on garde tel quel
                continue;
            }
            
            // Si c'est une chaîne, essayer de la décoder
            if (is_string($signalement['photos'])) {
                $decoded = json_decode($signalement['photos'], true);
                if ($decoded !== null && is_array($decoded)) {
                    $signalement['photos'] = $decoded;
                } else {
                    // Si le décodage échoue, essayer de traiter comme une seule photo
                    if (strpos($signalement['photos'], 'data:image') === 0) {
                        $signalement['photos'] = [$signalement['photos']];
                    } else {
                        // Si ce n'est pas une photo valide, mettre null
                        $signalement['photos'] = null;
                    }
                }
            }
        } else {
            $signalement['photos'] = null;
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $signalements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

