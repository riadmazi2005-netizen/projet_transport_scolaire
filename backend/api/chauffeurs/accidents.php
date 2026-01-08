<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
$chauffeur_id = $_GET['chauffeur_id'] ?? null;
if (!$chauffeur_id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'chauffeur_id requis']); exit; }
$pdo = getDBConnection();
$stmt = $pdo->prepare('SELECT * FROM accidents WHERE chauffeur_id = ? ORDER BY date DESC');
$stmt->execute([$chauffeur_id]);
echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);









