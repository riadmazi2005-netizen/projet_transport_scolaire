<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->query('
        SELECT 
            pe.*,
            b.numero as bus_numero,
            b.marque as bus_marque,
            b.modele as bus_modele,
            u.prenom as chauffeur_prenom,
            u.nom as chauffeur_nom,
            c.id as chauffeur_id
        FROM prise_essence pe
        LEFT JOIN bus b ON pe.bus_id = b.id
        LEFT JOIN chauffeurs c ON pe.chauffeur_id = c.id
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        ORDER BY pe.date DESC, pe.heure DESC
    ');
    $prises = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Traiter les photos pour chaque prise
    foreach ($prises as &$prise) {
        if (!empty($prise['photo_ticket']) && $prise['photo_ticket'] !== 'null') {
            // Nettoyer la photo si elle contient des caractères d'échappement
            if (strpos($prise['photo_ticket'], '\\') !== false) {
                $prise['photo_ticket'] = stripslashes($prise['photo_ticket']);
            }
            // Vérifier si la photo est tronquée (exactement 255 caractères = probablement tronquée par VARCHAR(255))
            if (strlen($prise['photo_ticket']) == 255) {
                error_log("ATTENTION: Photo tronquée pour prise_essence ID {$prise['id']} - longueur: 255");
            }
        }
    }
    unset($prise); // Libérer la référence
    
    echo json_encode([
        'success' => true,
        'data' => $prises
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

