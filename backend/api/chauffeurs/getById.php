<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
$id = $_GET['id'] ?? null;
if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID requis']); exit; }
$pdo = getDBConnection();
$stmt = $pdo->prepare('SELECT c.*, u.nom, u.prenom, u.email, u.telephone FROM chauffeurs c LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id WHERE c.id = ?');
$stmt->execute([$id]);
$chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode(['success' => true, 'data' => $chauffeur ?: null]);









