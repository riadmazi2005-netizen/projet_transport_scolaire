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
    
    echo json_encode([
        'success' => true,
        'data' => $prises
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

