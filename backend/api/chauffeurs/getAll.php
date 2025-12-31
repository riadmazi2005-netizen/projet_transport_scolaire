<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
$pdo = getDBConnection();
$stmt = $pdo->query('
    SELECT c.*, u.nom, u.prenom, u.email, u.telephone 
    FROM chauffeurs c
    LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
');
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
?>







