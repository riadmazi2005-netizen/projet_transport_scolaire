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
    
    // Récupérer le responsable pour obtenir l'utilisateur_id
    $stmt = $pdo->prepare('SELECT utilisateur_id FROM responsables_bus WHERE id = ?');
    $stmt->execute([$data['id']]);
    $responsable = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$responsable) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Responsable non trouvé']);
        exit;
    }
    
    $utilisateurId = $responsable['utilisateur_id'];
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
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE email = ? AND id != ?');
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
    if (isset($data['telephone'])) {
        $userFields[] = 'telephone = ?';
        $userValues[] = $data['telephone'];
        unset($data['telephone']);
    }
    if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
        $userFields[] = 'mot_de_passe = ?';
        $userValues[] = $data['mot_de_passe']; // Mot de passe en clair (non hashé)
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
    
    // Préparer les champs responsable à mettre à jour
    $respFields = [];
    $respValues = [];
    
    // Vérifier si la colonne salaire existe avant de l'utiliser
    try {
        $checkSalaire = $pdo->query("SHOW COLUMNS FROM responsables_bus LIKE 'salaire'");
        if ($checkSalaire->rowCount() > 0 && isset($data['salaire'])) {
            $respFields[] = 'salaire = ?';
            $respValues[] = $data['salaire'];
            unset($data['salaire']);
        }
    } catch (Exception $e) {
        // Colonne n'existe pas, on ignore
        unset($data['salaire']);
    }
    
    if (isset($data['zone_responsabilite'])) {
        $respFields[] = 'zone_responsabilite = ?';
        $respValues[] = $data['zone_responsabilite'];
        unset($data['zone_responsabilite']);
    }
    
    // Mettre à jour la table responsables_bus si nécessaire
    if (!empty($respFields)) {
        $respValues[] = $id;
        $sql = 'UPDATE responsables_bus SET ' . implode(', ', $respFields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($respValues);
    }
    
    // Récupérer le responsable mis à jour
    $stmt = $pdo->prepare('
        SELECT 
            r.*,
            u.nom,
            u.prenom,
            u.email,
            u.telephone,
            u.mot_de_passe as user_password,
            u.statut as user_statut
        FROM responsables_bus r
        LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
        WHERE r.id = ?
    ');
    $stmt->execute([$id]);
    $responsable = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $responsable
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
}
?>

