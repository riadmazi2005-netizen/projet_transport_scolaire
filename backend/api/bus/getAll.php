<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$pdo = getDBConnection();
$stmt = $pdo->query('SELECT * FROM bus ORDER BY date_creation DESC');
$buses = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'data' => $buses
]);
?>







