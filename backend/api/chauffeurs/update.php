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
    
    // Récupérer le chauffeur pour obtenir l'utilisateur_id
    $stmt = $pdo->prepare('SELECT utilisateur_id FROM chauffeurs WHERE id = ?');
    $stmt->execute([$data['id']]);
    $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$chauffeur) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Chauffeur non trouvé']);
        exit;
    }
    
    $utilisateurId = $chauffeur['utilisateur_id'];
    $id = $data['id'];
    unset($data['id']);
    
    // Préparer les champs utilisateur à mettre à jour
    $userFields = [];
    $userValues = [];
    
    if (isset($data['nom'])) {
        $userFields[] = 'nom = ?';
        $userValues[] = $data['nom'];
        unset($data['nom']);
    }
    if (isset($data['prenom'])) {
        $userFields[] = 'prenom = ?';
        $userValues[] = $data['prenom'];
        unset($data['prenom']);
    }
    if (isset($data['email'])) {
        // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(?) AND id != ?');
        $stmt->execute([$data['email'], $utilisateurId]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
            exit;
        }
        $userFields[] = 'email = ?';
        $userValues[] = $data['email'];
        unset($data['email']);
    }
    if (isset($data['telephone']) && !empty(trim($data['telephone']))) {
        // Vérifier que le téléphone n'est pas déjà utilisé par un autre utilisateur
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE telephone = ? AND id != ?');
        $stmt->execute([trim($data['telephone']), $utilisateurId]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce numéro de téléphone est déjà utilisé']);
            exit;
        }
        $userFields[] = 'telephone = ?';
        $userValues[] = trim($data['telephone']);
        unset($data['telephone']);
    }
    if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
        $userFields[] = 'mot_de_passe = ?';
        $userFields[] = 'mot_de_passe_plain = ?';
        $hashedPassword = password_hash($data['mot_de_passe'], PASSWORD_DEFAULT);
        $userValues[] = $hashedPassword;
        $userValues[] = $data['mot_de_passe'];
        unset($data['mot_de_passe']);
    }
    if (isset($data['statut'])) {
        $userFields[] = 'statut = ?';
        $userValues[] = $data['statut'];
        unset($data['statut']);
    }
    
    // Mettre à jour la table utilisateurs si nécessaire
    if (!empty($userFields)) {
        $userValues[] = $utilisateurId;
        $sql = 'UPDATE utilisateurs SET ' . implode(', ', $userFields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($userValues);
    }
    
    // Préparer les champs chauffeur à mettre à jour
    $chauffeurFields = [];
    $chauffeurValues = [];
    
    // Gérer numero_permis et date_expiration_permis
    if (isset($data['numero_permis'])) {
        $chauffeurFields[] = 'numero_permis = ?';
        $chauffeurValues[] = $data['numero_permis'];
        unset($data['numero_permis']);
    }
    if (isset($data['date_expiration_permis'])) {
        $chauffeurFields[] = 'date_expiration_permis = ?';
        $chauffeurValues[] = $data['date_expiration_permis'];
        unset($data['date_expiration_permis']);
    }
    if (isset($data['nombre_accidents'])) {
        $chauffeurFields[] = 'nombre_accidents = ?';
        $chauffeurValues[] = $data['nombre_accidents'];
        unset($data['nombre_accidents']);
    }
    if (isset($data['statut'])) {
        $chauffeurFields[] = 'statut = ?';
        $chauffeurValues[] = $data['statut'];
        unset($data['statut']);
    }
    if (isset($data['salaire'])) {
        $chauffeurFields[] = 'salaire = ?';
        $chauffeurValues[] = floatval($data['salaire']);
        unset($data['salaire']);
    }
    
    // Mettre à jour les autres champs restants (ne devrait plus rien rester normalement)
    foreach ($data as $key => $value) {
        $chauffeurFields[] = "$key = ?";
        $chauffeurValues[] = $value;
    }
    
    // Mettre à jour la table chauffeurs si nécessaire
    if (!empty($chauffeurFields)) {
        $chauffeurValues[] = $id;
        $sql = 'UPDATE chauffeurs SET ' . implode(', ', $chauffeurFields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($chauffeurValues);
    }
    
    // Récupérer le chauffeur mis à jour
    $stmt = $pdo->prepare('
        SELECT c.*, u.nom, u.prenom, u.email, u.telephone, u.mot_de_passe as user_password, u.mot_de_passe_plain
        FROM chauffeurs c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE c.id = ?
    ');
    $stmt->execute([$id]);
    $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $chauffeur
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
}
?>
