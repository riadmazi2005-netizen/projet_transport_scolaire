<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$pdo = getDBConnection();
// Récupérer les administrateurs via la table administrateurs
$stmt = $pdo->prepare('
    SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.statut, a.id as admin_id
    FROM utilisateurs u
    INNER JOIN administrateurs a ON a.utilisateur_id = u.id
    WHERE u.statut = ?
');
$stmt->execute(['Actif']);
$admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Ajouter le role à chaque admin
foreach ($admins as &$admin) {
    $admin['role'] = 'admin';
}

echo json_encode([
    'success' => true,
    'data' => $admins
]);



