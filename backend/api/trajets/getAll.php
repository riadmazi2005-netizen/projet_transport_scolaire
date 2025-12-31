<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
$pdo = getDBConnection();
$stmt = $pdo->query('SELECT * FROM trajets ORDER BY date_creation DESC');
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
?>







