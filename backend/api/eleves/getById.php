<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare('SELECT * FROM eleves WHERE id = ?');
$stmt->execute([$id]);
$eleve = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$eleve) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Élève non trouvé']);
    exit;
}

echo json_encode([
    'success' => true,
    'data' => $eleve
]);









