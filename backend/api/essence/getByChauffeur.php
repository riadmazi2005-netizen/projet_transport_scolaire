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
        SELECT * FROM prise_essence 
        WHERE chauffeur_id = ? 
        ORDER BY date DESC, heure DESC
    ');
    $stmt->execute([$chauffeur_id]);
    $prises = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: vérifier les photos
    foreach ($prises as &$prise) {
        if (!empty($prise['photo_ticket'])) {
            $photoLength = strlen($prise['photo_ticket']);
            // Si la photo est tronquée (exactement 255 caractères), elle a probablement été tronquée
            if ($photoLength == 255) {
                error_log("ATTENTION: Photo tronquée pour prise_essence ID {$prise['id']} - longueur: $photoLength");
            }
            // Nettoyer la photo si elle contient des caractères d'échappement
            if (strpos($prise['photo_ticket'], '\\') !== false) {
                $prise['photo_ticket'] = stripslashes($prise['photo_ticket']);
            }
        }
    }
    unset($prise); // Libérer la référence
    
    echo json_encode([
        'success' => true,
        'data' => $prises
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}



