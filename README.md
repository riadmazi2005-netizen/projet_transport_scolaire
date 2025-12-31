# 🚌 Système de Transport Scolaire

## 📋 Table des matières
1. [Installation](#installation)
2. [Configuration de la base de données](#configuration-de-la-base-de-données)
3. [Comptes de test](#comptes-de-test)
4. [Tests rapides](#tests-rapides)
5. [Diagnostic des erreurs](#diagnostic-des-erreurs)

---

## 🚀 Installation

### Prérequis
- XAMPP (Apache + MySQL)
- Node.js et npm
- PHP 7.4 ou supérieur

### Étapes d'installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd projet_transport_scolaire
   ```

2. **Installer les dépendances frontend**
   ```bash
   npm install
   ```

3. **Configurer le backend**
   - Copier le dossier `backend` vers `C:\xampp\htdocs\backend`
   - Configurer la connexion à la base de données dans `backend/config/database.php`

4. **Créer la base de données**
   - Importer le fichier `transport_scolaire.sql` dans phpMyAdmin
   - Ou exécuter : `mysql -u root -p < transport_scolaire.sql`

5. **Démarrer les services**
   - Démarrer XAMPP (Apache + MySQL)
   - Démarrer le frontend : `npm run dev`

---

## 🗄️ Configuration de la base de données

### Import du schéma

Le fichier `transport_scolaire.sql` contient :
- ✅ Le schéma complet de la base de données
- ✅ Les mises à jour de structure (table demandes avec types supplémentaires)
- ✅ Les données de test complètes
- ✅ Les index pour améliorer les performances

**Pour importer :**
1. Ouvrir phpMyAdmin : http://localhost/phpmyadmin
2. Créer une nouvelle base de données `transport_scolaire` (ou laisser le script la créer)
3. Importer le fichier `transport_scolaire.sql`

**OU via ligne de commande :**
```bash
mysql -u root -p < transport_scolaire.sql
```

### Structure de la base de données

Le système comprend les tables suivantes :
- `utilisateurs` - Admins, chauffeurs, responsables, tuteurs
- `eleves` - Élèves inscrits
- `chauffeurs` - Informations des chauffeurs
- `responsables_bus` - Responsables de zones
- `trajets` - Trajets définis
- `bus` - Bus du parc
- `accidents` - Historique des accidents
- `notifications` - Notifications système
- `demandes` - Demandes d'inscription/modification
- `inscriptions` - Inscriptions des élèves
- `paiements` - Historique des paiements
- `presences` - Suivi des présences
- `conduire` - Relations chauffeurs-trajets

---

## 🔐 Comptes de test

**IMPORTANT :** Tous les comptes de test utilisent le même mot de passe : **`test123`**

### Comptes disponibles

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| **Admin** | `admin@transport.ma` | `test123` | Administrateur système |
| **Responsable** | `nadia.kettani@transport.ma` | `test123` | Responsable Zone Centre |
| **Responsable** | `omar.benjelloun@transport.ma` | `test123` | Responsable Zone Nord |
| **Chauffeur** | `ahmed.idrissi@transport.ma` | `test123` | Chauffeur BUS-001 |
| **Chauffeur** | `youssef.tazi@transport.ma` | `test123` | Chauffeur BUS-002 |
| **Chauffeur** | `karim.elfassi@transport.ma` | `test123` | Chauffeur BUS-003 |
| **Tuteur** | `mohammed.alami@email.ma` | `test123` | Tuteur avec 2 élèves |
| **Tuteur** | `fatima.benjelloun@email.ma` | `test123` | Tuteur avec 2 élèves |

### Vérification des hash de mots de passe

Le hash bcrypt utilisé pour "test123" est :
```
$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

**Pour vérifier que le hash est correct :**
```php
<?php
$hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
var_dump(password_verify('test123', $hash)); // Doit retourner true
?>
```

**Si les connexions ne fonctionnent pas :**
1. Vérifier que la base de données a été importée correctement
2. Vérifier que les hash dans la table `utilisateurs` sont corrects
3. Utiliser le script PHP pour régénérer les hash : `backend/create_and_update_test_accounts.php`

---

## ⚡ Tests rapides (5 minutes)

### Test 1: Vérifier XAMPP (30 secondes)
```
✅ Ouvrir XAMPP Panneau de Contrôle
✅ Vérifier Apache = VERT (démarré)
✅ Vérifier MySQL = VERT (démarré)
```

**Si non vert → Cliquer sur "Start" pour chaque service**

---

### Test 2: Vérifier Backend Accessible (1 minute)
**Ouvrir dans le navigateur :**
```
http://localhost/backend/test.php
```

**Résultat attendu :**
```json
{
    "success": true,
    "message": "Backend accessible et base de données connectée",
    ...
}
```

**Si erreur 404 :**
- Le dossier `backend` n'est pas dans `C:\xampp\htdocs\`
- **ACTION :** Copier le dossier `backend` vers `C:\xampp\htdocs\backend`

**Si erreur 500 :**
- Problème de connexion à la base de données
- **ACTION :** Vérifier que MySQL est démarré et que la base `transport_scolaire` existe

---

### Test 3: Vérifier API Backend (1 minute)
**Ouvrir dans le navigateur :**
```
http://localhost/backend/api/test-connection.php
```

**Résultat attendu :**
```json
{
    "success": true,
    "message": "API backend accessible",
    ...
}
```

**Si erreur → Vérifier la structure des dossiers**

---

### Test 4: Tester la connexion (1 minute)

1. **Ouvrir votre application frontend** (http://localhost:3000)
2. **Tester la connexion avec :**
   - Email: `admin@transport.ma`
   - Mot de passe: `test123`
   - Rôle: `admin`

**Résultat attendu :**
- Connexion réussie avec token JWT
- Redirection vers le dashboard admin

---

### Test 5: Tester l'Inscription via Console Navigateur (2 minutes)

1. **Ouvrir votre application frontend** (http://localhost:3000)
2. **Appuyer sur F12** pour ouvrir la console
3. **Aller dans l'onglet Console**
4. **Copier-coller ce code :**

```javascript
fetch('http://localhost/backend/api/auth/register.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nom: 'Test',
    prenom: 'User',
    email: 'test' + Date.now() + '@test.com',
    mot_de_passe: 'test123',
    telephone: '0612345678',
    role: 'tuteur'
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Success:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

**Résultat attendu :**
```json
{
    "success": true,
    "message": "Inscription réussie. Vous pouvez maintenant vous connecter.",
    "user": { ... }
}
```

---

## 🔍 Diagnostic des erreurs

### Erreur: "Failed to fetch"

**Console affiche :**
```
[API] POST http://localhost/backend/api/auth/register.php
❌ Error: Impossible de se connecter au serveur...
```

**Solutions :**
1. ✅ Vérifier Test 1 (XAMPP démarré)
2. ✅ Vérifier Test 2 (Backend accessible)
3. ✅ Vérifier que le dossier est dans `C:\xampp\htdocs\backend`

---

### Erreur: "CORS policy"

**Console affiche :**
```
Access to fetch at 'http://localhost/backend/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution :**
- Vérifier que `backend/config/headers.php` contient les headers CORS
- Le fichier doit être inclus en premier dans tous les fichiers PHP API

---

### Erreur: "404 Not Found"

**Console affiche :**
```
[API] POST http://localhost/backend/api/auth/register.php
❌ Error: 404 Not Found
```

**Solution :**
- Vérifier que le fichier existe : `C:\xampp\htdocs\backend\api\auth\register.php`
- Vérifier la structure des dossiers

---

### Erreur: "500 Internal Server Error"

**Console affiche :**
```
❌ Error: 500 Internal Server Error
```

**Solution :**
1. Ouvrir : `C:\xampp\apache\logs\error.log`
2. Chercher la dernière erreur
3. Corriger le problème indiqué dans les logs

---

### Erreur: "Email ou mot de passe incorrect"

**Causes possibles :**
1. Le hash du mot de passe dans la base de données est incorrect
2. Le mot de passe utilisé ne correspond pas au hash

**Solution :**
1. Vérifier que vous utilisez le bon mot de passe : **`test123`**
2. Vérifier le hash dans la base de données :
   ```sql
   SELECT email, mot_de_passe FROM utilisateurs WHERE email = 'admin@transport.ma';
   ```
3. Le hash doit être : `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`
4. Si le hash est différent, réimporter `transport_scolaire.sql` ou utiliser le script PHP :
   ```
   http://localhost/backend/create_and_update_test_accounts.php
   ```

---

### Erreur: "Email déjà utilisé" (alors que ce n'est pas le cas)

**Cause :** Problème avec la base de données

**Solution :**
1. Ouvrir phpMyAdmin : http://localhost/phpmyadmin
2. Sélectionner la base `transport_scolaire`
3. Vérifier que la table `utilisateurs` existe
4. Vérifier la structure de la table

---

## 📋 Checklist finale

Avant de tester l'application, vérifiez :

- [ ] XAMPP Apache démarré
- [ ] XAMPP MySQL démarré  
- [ ] `http://localhost/backend/test.php` fonctionne
- [ ] `http://localhost/backend/api/test-connection.php` fonctionne
- [ ] Base de données `transport_scolaire` existe
- [ ] Table `utilisateurs` existe dans la base
- [ ] Frontend démarre sans erreur (`npm run dev`)
- [ ] Console du navigateur ouverte (F12) pour voir les erreurs
- [ ] Les hash de mots de passe sont corrects (tous utilisent "test123")

---

## 🎯 Résultat des tests

**Si tous les tests passent :**
✅ **Votre système fonctionne !** Vous pouvez utiliser tous les comptes de test avec le mot de passe `test123`.

**Si un test échoue :**
❌ **Notez le numéro du test qui échoue** et consultez la section "Diagnostic" ci-dessus.

---

## 💡 Astuce Pro

**Toujours garder la console du navigateur ouverte (F12)** pendant les tests pour voir les erreurs en temps réel !

Les messages `[API]` dans la console vous indiquent exactement ce qui se passe :
- ✅ Si vous voyez `[API] POST ...` → La requête est envoyée
- ✅ Si vous voyez `[API] Success:` → Tout fonctionne
- ❌ Si vous voyez `[API] Error:` → Regardez le message d'erreur

---

## 🔧 Scripts utiles

### Régénérer les hash de mots de passe

Si vous avez des problèmes avec les hash, utilisez ces scripts PHP :

1. **Créer/mettre à jour les comptes de test :**
   ```
   http://localhost/backend/create_and_update_test_accounts.php
   ```

2. **Mettre à jour uniquement les mots de passe :**
   ```
   http://localhost/backend/update_test_passwords.php
   ```

3. **Générer de nouveaux hash (ligne de commande) :**
   ```bash
   php generate_password_hashes.php
   ```

---

## 📝 Notes importantes

### Problème de codes hachés résolu

**Avant :** Il y avait plusieurs fichiers SQL avec des hash différents et confus :
- Certains utilisaient `$2y$10$hashedpassword` (invalide)
- Certains mentionnaient différents mots de passe (admin123, respo123, chauffeur123) sans les bons hash
- Confusion entre plusieurs fichiers de test

**Maintenant :** 
- ✅ Un seul fichier SQL : `transport_scolaire.sql`
- ✅ Un seul mot de passe pour tous : `test123`
- ✅ Hash bcrypt valide et vérifié : `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`
- ✅ Tous les comptes de test fonctionnent avec le même mot de passe

### Comment résoudre les erreurs de hash

Si vous rencontrez des erreurs de connexion :

1. **Vérifier le hash dans la base de données :**
   ```sql
   SELECT email, LEFT(mot_de_passe, 30) as hash_preview FROM utilisateurs;
   ```

2. **Tester le hash avec PHP :**
   ```php
   <?php
   $hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
   var_dump(password_verify('test123', $hash)); // true
   ?>
   ```

3. **Si le hash est incorrect, réimporter le fichier SQL :**
   - Supprimer la base de données existante
   - Réimporter `transport_scolaire.sql`

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs Apache : `C:\xampp\apache\logs\error.log`
2. Vérifier la console du navigateur (F12)
3. Vérifier les logs PHP si activés

---

**Dernière mise à jour :** Consolidation des fichiers SQL et MD - Tous les comptes utilisent maintenant `test123` comme mot de passe.

