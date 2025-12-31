<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $id = $data['id'];
    
    // Vérifier que l'utilisateur existe et est un tuteur
    $stmt = $pdo->prepare('
        SELECT u.id, t.id as tuteur_id
        FROM utilisateurs u
        INNER JOIN tuteurs t ON t.utilisateur_id = u.id
        WHERE u.id = ?
    ');
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tuteur non trouvé']);
        exit;
    }
    
    // Préparer les données pour la mise à jour (exclure id et mot_de_passe)
    unset($data['id']);
    unset($data['mot_de_passe']);
    unset($data['role']); // Ne pas permettre le changement de rôle via cette API
    
    $fields = [];
    $values = [];
    
    // Champs autorisés pour la mise à jour
    // Note: adresse n'existe pas dans la table utilisateurs, donc on ne l'inclut pas
    $allowedFields = ['nom', 'prenom', 'email', 'telephone'];
    
    foreach ($data as $key => $value) {
        if (in_array($key, $allowedFields)) {
            $fields[] = "$key = ?";
            $values[] = $value;
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucune donnée à mettre à jour']);
        exit;
    }
    
    $values[] = $id;
    
    $sql = "UPDATE utilisateurs SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    // Récupérer l'utilisateur mis à jour (sans le mot de passe)
    $stmt = $pdo->prepare('SELECT id, nom, prenom, email, telephone, statut, date_creation, date_modification FROM utilisateurs WHERE id = ?');
    $stmt->execute([$id]);
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Ajouter le role à la réponse
    $updatedUser['role'] = 'tuteur';
    $updatedUser['type_id'] = $user['tuteur_id'];
    
    echo json_encode([
        'success' => true,
        'data' => $updatedUser
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
}
?>

