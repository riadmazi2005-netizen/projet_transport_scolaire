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
    
    // Séparer les champs utilisateurs et tuteurs
    $userFields = [];
    $userValues = [];
    $tuteurFields = [];
    $tuteurValues = [];
    
    // Vérifier l'unicité de l'email si modifié
    if (isset($data['email'])) {
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(?) AND id != ?');
        $stmt->execute([$data['email'], $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
            exit;
        }
        $userFields[] = 'email = ?';
        $userValues[] = trim($data['email']);
        unset($data['email']);
    }
    
    // Vérifier l'unicité du téléphone si modifié
    if (isset($data['telephone']) && !empty(trim($data['telephone']))) {
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE telephone = ? AND id != ?');
        $stmt->execute([trim($data['telephone']), $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce numéro de téléphone est déjà utilisé']);
            exit;
        }
        $userFields[] = 'telephone = ?';
        $userValues[] = trim($data['telephone']);
        unset($data['telephone']);
    }
    
    // Champs utilisateurs
    $userAllowedFields = ['nom', 'prenom'];
    foreach ($data as $key => $value) {
        if (in_array($key, $userAllowedFields)) {
            $userFields[] = "$key = ?";
            $userValues[] = trim($value);
            unset($data[$key]);
        }
    }
    
    // Champs tuteurs (adresse, photo_identite)
    if (isset($data['adresse'])) {
        $tuteurFields[] = 'adresse = ?';
        $tuteurValues[] = trim($data['adresse']);
        unset($data['adresse']);
    }
    
    if (isset($data['photo_identite'])) {
        $tuteurFields[] = 'photo_identite = ?';
        $tuteurValues[] = $data['photo_identite'];
        unset($data['photo_identite']);
    }
    
    // Mettre à jour la table utilisateurs si nécessaire
    if (!empty($userFields)) {
        $userValues[] = $id;
        $sql = "UPDATE utilisateurs SET " . implode(', ', $userFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($userValues);
    }
    
    // Mettre à jour la table tuteurs si nécessaire
    if (!empty($tuteurFields)) {
        $tuteurValues[] = $user['tuteur_id'];
        $sql = "UPDATE tuteurs SET " . implode(', ', $tuteurFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($tuteurValues);
    }
    
    // Vérifier qu'il y a au moins une mise à jour
    if (empty($userFields) && empty($tuteurFields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucune donnée à mettre à jour']);
        exit;
    }
    
    // Récupérer l'utilisateur mis à jour avec l'adresse du tuteur
    $stmt = $pdo->prepare('
        SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.statut, u.date_creation, u.date_modification, t.adresse
        FROM utilisateurs u
        INNER JOIN tuteurs t ON t.utilisateur_id = u.id
        WHERE u.id = ?
    ');
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
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
}


