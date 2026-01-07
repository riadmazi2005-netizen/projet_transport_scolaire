<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    // Récupérer les bus avec le calcul dynamique des places
    $stmt = $pdo->query('
        SELECT 
            b.*,
            COUNT(i.id) as eleves_inscrits,
            (b.capacite - COUNT(i.id)) as places_restantes
        FROM bus b
        LEFT JOIN inscriptions i ON i.bus_id = b.id AND i.statut = "Active"
        GROUP BY b.id
        ORDER BY b.numero ASC
    ');
    $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $buses
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors du chargement des bus'
    ]);
}
?>







