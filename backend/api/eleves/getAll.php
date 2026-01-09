<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->query('SELECT * FROM eleves ORDER BY date_creation DESC');
    $eleves = $stmt->fetchAll(PDO::FETCH_ASSOC); // Good practice to be explicit

    echo json_encode([
        'success' => true,
        'data' => $eleves
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des élèves: ' . $e->getMessage()
    ]);
}








