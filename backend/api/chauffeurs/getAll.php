<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
try {
    $pdo = getDBConnection();
    $stmt = $pdo->query('
        SELECT c.*, u.nom, u.prenom, u.email, u.telephone, u.mot_de_passe as user_password, u.mot_de_passe_plain
        FROM chauffeurs c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
    ');
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}








