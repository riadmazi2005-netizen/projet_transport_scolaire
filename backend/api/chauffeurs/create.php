<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = getDBConnection();
    
    // Vérifier si l'email existe déjà
    if (isset($data['email'])) {
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
            exit;
        }
    }
    
    // Créer l'utilisateur si les données sont fournies
    $utilisateurId = null;
    if (isset($data['nom']) && isset($data['prenom']) && isset($data['email'])) {
        // Stocker le mot de passe en clair (non hashé)
        $motDePasse = $data['mot_de_passe'] ?? '';
        
        $stmt = $pdo->prepare('
            INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, statut)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['nom'],
            $data['prenom'],
            $data['email'],
            $data['telephone'] ?? null,
            $motDePasse, // Mot de passe en clair
            $data['statut'] ?? 'Actif'
        ]);
        
        $utilisateurId = $pdo->lastInsertId();
    } elseif (isset($data['utilisateur_id'])) {
        $utilisateurId = $data['utilisateur_id'];
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données utilisateur ou utilisateur_id requis']);
        exit;
    }
    
    // Créer le chauffeur
    // Note: Si les colonnes salaire et date_embauche existent, on les ajoute
    $columns = ['utilisateur_id'];
    $values = [$utilisateurId];
    $placeholders = ['?'];
    
    // Vérifier si la colonne salaire existe et l'ajouter si nécessaire
    $checkSalaire = $pdo->query("SHOW COLUMNS FROM chauffeurs LIKE 'salaire'");
    if ($checkSalaire->rowCount() > 0 && isset($data['salaire'])) {
        $columns[] = 'salaire';
        $values[] = $data['salaire'];
        $placeholders[] = '?';
    }
    
    // Vérifier si la colonne date_embauche existe et l'ajouter si nécessaire
    $checkDateEmbauche = $pdo->query("SHOW COLUMNS FROM chauffeurs LIKE 'date_embauche'");
    if ($checkDateEmbauche->rowCount() > 0 && isset($data['date_embauche']) && !empty($data['date_embauche'])) {
        $columns[] = 'date_embauche';
        $values[] = $data['date_embauche'];
        $placeholders[] = '?';
    }
    
    // Ajouter statut
    $columns[] = 'statut';
    $values[] = $data['statut'] ?? 'Actif';
    $placeholders[] = '?';
    
    $sql = 'INSERT INTO chauffeurs (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    $chauffeurId = $pdo->lastInsertId();
    
    // Récupérer le chauffeur créé avec les infos utilisateur
    $stmt = $pdo->prepare('
        SELECT c.*, u.nom, u.prenom, u.email, u.telephone, u.mot_de_passe as user_password
        FROM chauffeurs c
        LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE c.id = ?
    ');
    $stmt->execute([$chauffeurId]);
    $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $chauffeur
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
}
?>
