<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Lire les données JSON
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Vérifier que le JSON est valide
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données JSON invalides']);
    exit;
}

// Validation des champs requis
if (!isset($data['nom']) || empty(trim($data['nom']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Le nom est requis']);
    exit;
}

if (!isset($data['prenom']) || empty(trim($data['prenom']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Le prénom est requis']);
    exit;
}

if (!isset($data['email']) || empty(trim($data['email']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'L\'email est requis']);
    exit;
}

if (!isset($data['mot_de_passe']) || empty($data['mot_de_passe'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Le mot de passe est requis']);
    exit;
}

// Valider le format de l'email
$email = trim(strtolower($data['email']));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format d\'email invalide']);
    exit;
}

// Valider la longueur du mot de passe
if (strlen($data['mot_de_passe']) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier si l'email existe déjà (comparaison insensible à la casse)
    $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(?)');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Un compte existe déjà avec cet email']);
        exit;
    }
    
    // Hasher le mot de passe
    $hashedPassword = password_hash($data['mot_de_passe'], PASSWORD_DEFAULT);
    
    if ($hashedPassword === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors du hashage du mot de passe']);
        exit;
    }
    
    // Préparer les données pour l'insertion
    $nom = trim($data['nom']);
    $prenom = trim($data['prenom']);
    $telephone = isset($data['telephone']) && !empty(trim($data['telephone'])) 
        ? trim($data['telephone']) 
        : null;
    
    // Insérer le nouvel utilisateur (SANS colonne role)
    $stmt = $pdo->prepare('
        INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $nom,
        $prenom,
        $email,
        $hashedPassword,
        $telephone,
        'Actif'
    ]);
    
    $userId = $pdo->lastInsertId();
    
    if (!$userId) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du compte']);
        exit;
    }
    
    // Créer l'entrée dans la table tuteurs (inscription = toujours tuteur)
    $stmt = $pdo->prepare('INSERT INTO tuteurs (utilisateur_id) VALUES (?)');
    $stmt->execute([$userId]);
    $tuteurId = $pdo->lastInsertId();
    
    // Récupérer l'utilisateur créé (sans le mot de passe)
    $stmt = $pdo->prepare('SELECT id, nom, prenom, email, telephone, statut, date_creation FROM utilisateurs WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Ajouter le type d'utilisateur à la réponse
    $user['role'] = 'tuteur';
    $user['type_id'] = $tuteurId;
    
    if (!$user) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des données utilisateur']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'message' => 'Inscription réussie. Vous pouvez maintenant vous connecter.'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Erreur inscription PDO: ' . $e->getMessage());
    
    // Vérifier si c'est une erreur de contrainte unique (email dupliqué)
    if ($e->getCode() == 23000 || strpos($e->getMessage(), 'Duplicate entry') !== false) {
        echo json_encode([
            'success' => false, 
            'message' => 'Un compte existe déjà avec cet email'
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Erreur lors de la création du compte. Veuillez réessayer.'
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Erreur générale inscription: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur lors de la création du compte. Veuillez réessayer.'
    ], JSON_UNESCAPED_UNICODE);
}
?>

