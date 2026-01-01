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
    
    // Préparer les champs chauffeur à mettre à jour
    $chauffeurFields = [];
    $chauffeurValues = [];
    
    // Ignorer numero_permis (supprimé de l'interface)
    if (isset($data['permis']) || isset($data['numero_permis'])) {
        unset($data['permis']);
        unset($data['numero_permis']);
    }
    
    // Vérifier si la colonne salaire existe avant de l'utiliser
    $checkSalaire = $pdo->query("SHOW COLUMNS FROM chauffeurs LIKE 'salaire'");
    if ($checkSalaire->rowCount() > 0 && isset($data['salaire'])) {
        $chauffeurFields[] = 'salaire = ?';
        $chauffeurValues[] = $data['salaire'];
        unset($data['salaire']);
    } elseif (isset($data['salaire'])) {
        unset($data['salaire']);
    }
    
    // Vérifier si la colonne date_embauche existe avant de l'utiliser
    $checkDateEmbauche = $pdo->query("SHOW COLUMNS FROM chauffeurs LIKE 'date_embauche'");
    if ($checkDateEmbauche->rowCount() > 0 && isset($data['date_embauche'])) {
        $chauffeurFields[] = 'date_embauche = ?';
        $chauffeurValues[] = $data['date_embauche'];
        unset($data['date_embauche']);
    } elseif (isset($data['date_embauche'])) {
        unset($data['date_embauche']);
    }
    if (isset($data['nombre_accidents'])) {
        $chauffeurFields[] = 'nombre_accidents = ?';
        $chauffeurValues[] = $data['nombre_accidents'];
        unset($data['nombre_accidents']);
    }
    
    // Mettre à jour les autres champs restants
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
        SELECT c.*, u.nom, u.prenom, u.email, u.telephone, u.mot_de_passe as user_password
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
