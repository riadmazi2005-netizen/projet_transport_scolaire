<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$pdo = getDBConnection();
$stmt = $pdo->query('SELECT * FROM eleves ORDER BY date_creation DESC');
$eleves = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'data' => $eleves
]);
?>







