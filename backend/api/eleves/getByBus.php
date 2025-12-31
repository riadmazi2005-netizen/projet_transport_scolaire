<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$bus_id = $_GET['bus_id'] ?? null;
if (!$bus_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'bus_id requis']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare('
    SELECT e.* FROM eleves e
    JOIN inscriptions i ON e.id = i.eleve_id
    WHERE i.bus_id = ?
');
$stmt->execute([$bus_id]);
$eleves = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'data' => $eleves
]);
?>







