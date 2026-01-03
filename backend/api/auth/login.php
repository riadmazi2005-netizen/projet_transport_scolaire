<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
require_once '../../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if ((!isset($data['email']) && !isset($data['telephone'])) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email/téléphone et mot de passe requis']);
    exit;
}

// Récupérer le rôle attendu (optionnel mais recommandé pour la sécurité)
$expectedRole = isset($data['expected_role']) ? strtolower(trim($data['expected_role'])) : null;

try {
    $pdo = getDBConnection();
    
    // Récupérer l'utilisateur par email ou téléphone
    $identifier = $data['email'] ?? $data['telephone'];
    $stmt = $pdo->prepare('SELECT * FROM utilisateurs WHERE email = ? OR telephone = ?');
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email/téléphone ou mot de passe incorrect']);
        exit;
    }
    
    // Vérifier le mot de passe (supporte à la fois hashé et en clair)
    $passwordValid = false;
    // Si le mot de passe commence par $2y$ (bcrypt hash), utiliser password_verify
    if (strpos($user['mot_de_passe'], '$2y$') === 0) {
        $passwordValid = password_verify($data['password'], $user['mot_de_passe']);
    } else {
        // Sinon, comparaison directe en clair
        $passwordValid = ($data['password'] === $user['mot_de_passe']);
    }
    
    if (!$passwordValid) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email/téléphone ou mot de passe incorrect']);
        exit;
    }
    
    if ($user['statut'] !== 'Actif') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Compte désactivé']);
        exit;
    }
    
    // Déterminer le type d'utilisateur en vérifiant dans quelle table il existe
    $userType = null;
    $typeId = null;
    
    // Vérifier si c'est un administrateur
    $stmt = $pdo->prepare('SELECT id FROM administrateurs WHERE utilisateur_id = ?');
    $stmt->execute([$user['id']]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($admin) {
        $userType = 'admin';
        $typeId = $admin['id'];
    } else {
        // Vérifier si c'est un chauffeur
        $stmt = $pdo->prepare('SELECT id FROM chauffeurs WHERE utilisateur_id = ?');
        $stmt->execute([$user['id']]);
        $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($chauffeur) {
            $userType = 'chauffeur';
            $typeId = $chauffeur['id'];
        } else {
            // Vérifier si c'est un responsable
            $stmt = $pdo->prepare('SELECT id FROM responsables_bus WHERE utilisateur_id = ?');
            $stmt->execute([$user['id']]);
            $responsable = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($responsable) {
                $userType = 'responsable';
                $typeId = $responsable['id'];
            } else {
                // Vérifier si c'est un tuteur
                $stmt = $pdo->prepare('SELECT id, adresse FROM tuteurs WHERE utilisateur_id = ?');
                $stmt->execute([$user['id']]);
                $tuteur = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($tuteur) {
                    $userType = 'tuteur';
                    $typeId = $tuteur['id'];
                    $user['adresse'] = $tuteur['adresse']; // Ajouter l'adresse à l'utilisateur
                }
            }
        }
    }
    
    if (!$userType) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Type d\'utilisateur non reconnu']);
        exit;
    }
    
    // Vérifier que l'utilisateur correspond au rôle attendu (si spécifié)
    if ($expectedRole && $userType !== $expectedRole) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Accès refusé : vous ne pouvez pas vous connecter à cet espace avec ces identifiants']);
        exit;
    }
    
    // Générer le token JWT
    $tokenPayload = [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $userType,
        'type_id' => $typeId,
        'exp' => time() + (7 * 24 * 60 * 60) // 7 jours
    ];
    $token = generateToken($tokenPayload);
    
    // Retirer le mot de passe de la réponse
    unset($user['mot_de_passe']);
    
    // Ajouter le type d'utilisateur à la réponse
    $user['role'] = $userType;
    $user['type_id'] = $typeId;
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => $user
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la connexion']);
}
?>




