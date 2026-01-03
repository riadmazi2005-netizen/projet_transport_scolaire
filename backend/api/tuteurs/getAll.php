<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->query('
        SELECT 
            t.id,
            t.utilisateur_id,
            t.adresse,
            u.nom,
            u.prenom,
            u.email,
            u.telephone,
            t.date_creation
        FROM tuteurs t
        LEFT JOIN utilisateurs u ON t.utilisateur_id = u.id
        ORDER BY u.nom, u.prenom
    ');
    $tuteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $tuteurs
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur lors de la récupération des tuteurs: ' . $e->getMessage()
    ]);
}
?>

