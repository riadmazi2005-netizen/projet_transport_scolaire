<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('
        SELECT i.*,
               e.nom as eleve_nom,
               e.prenom as eleve_prenom,
               e.classe as eleve_classe,
               e.tuteur_id
        FROM inscriptions i
        LEFT JOIN eleves e ON i.eleve_id = e.id
        ORDER BY i.date_creation DESC
    ');
    $stmt->execute();
    $inscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $inscriptions
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des inscriptions: ' . $e->getMessage()
    ]);
}
?>

