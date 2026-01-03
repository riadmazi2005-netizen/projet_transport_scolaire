<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->query('
        SELECT 
            sm.*,
            b.numero as bus_numero,
            u.prenom as chauffeur_prenom,
            u.nom as chauffeur_nom
        FROM signalements_maintenance sm
        LEFT JOIN bus b ON sm.bus_id = b.id
        LEFT JOIN chauffeurs c ON sm.chauffeur_id = c.id
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        ORDER BY sm.date_creation DESC
    ');
    $signalements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $signalements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

