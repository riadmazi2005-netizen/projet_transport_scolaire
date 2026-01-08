<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('
        SELECT p.*,
               i.eleve_id,
               i.statut as inscription_statut
        FROM paiements p
        LEFT JOIN inscriptions i ON p.inscription_id = i.id
        ORDER BY p.date_paiement DESC, p.date_creation DESC
    ');
    $stmt->execute();
    $paiements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $paiements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des paiements: ' . $e->getMessage()
    ]);
}



