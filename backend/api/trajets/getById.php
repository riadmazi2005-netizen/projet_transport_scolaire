<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
$id = $_GET['id'] ?? null;
if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID requis']); exit; }
$pdo = getDBConnection();
$stmt = $pdo->prepare('SELECT * FROM trajets WHERE id = ?');
$stmt->execute([$id]);
$trajet = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode(['success' => true, 'data' => $trajet ?: null]);
?>







