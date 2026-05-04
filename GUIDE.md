# 🚀 Guide Complet d'Installation et d'Utilisation

Bienvenue ! Ce guide contient toutes les informations nécessaires pour installer, configurer, et utiliser le projet en local, ainsi que les codes de vérification et de connexion.

## 📋 Table des Matières
1. [Installation et Démarrage](#1-installation-et-démarrage)
2. [Comptes de Test et Connexion](#2-comptes-de-test-et-connexion)
3. [Résolution des Problèmes de Connexion](#3-résolution-des-problèmes-de-connexion)
4. [Règles de Conformité des Données](#4-règles-de-conformité-des-données)
5. [Tests et Requêtes SQL Utiles](#5-tests-et-requêtes-sql-utiles)

---

## 1. Installation et Démarrage

### 1.1 Prérequis
- **XAMPP** (Apache, MySQL)
- **Node.js** (npm)

### 1.2 Configuration de la Base de Données
1. Lancez **XAMPP Control Panel** et démarrez **Apache** et **MySQL**.
2. Allez sur `http://localhost/phpmyadmin`.
3. Créez une nouvelle base de données nommée `transport_scolaire`.
4. Sélectionnez la base et cliquez sur **Importer**.
5. Importez le fichier `transport_scolaire.sql` situé à la racine du projet.

### 1.3 Configuration du Backend (PHP)
1. Copiez le dossier `backend` du projet.
2. Collez-le dans `C:\xampp\htdocs\` (pour avoir `C:\xampp\htdocs\backend`).
3. **Vérification** : Allez sur `http://localhost/backend/test.php` dans votre navigateur. Vous devez voir un message "Backend accessible".

### 1.4 Configuration du Frontend (React)
1. Ouvrez un terminal dans le dossier racine du projet.
2. Installez les paquets npm :
   ```bash
   npm install
   ```
3. Lancez le serveur local :
   ```bash
   npm run dev
   ```
4. Cliquez sur le lien affiché (ex: `http://localhost:5173`) pour ouvrir l'application web.

---

## 2. Comptes de Test et Connexion

**IMPORTANT :** Le mot de passe pour tous les comptes est : **`test123`**

| Rôle | Email | Mot de passe | URL de connexion | Description |
|------|-------|--------------|------------------|-------------|
| **Administrateur** | `admin@transport.ma` | `test123` | `/AdminLogin` | Administrateur système |
| **Responsable** | `nadia.kettani@transport.ma` | `test123` | `/ResponsableLogin` | Responsable Zone Centre |
| **Responsable** | `omar.benjelloun@transport.ma` | `test123` | `/ResponsableLogin` | Responsable Zone Nord |
| **Chauffeur** | `ahmed.idrissi@transport.ma` | `test123` | `/ChauffeurLogin` | Chauffeur BUS-001 |
| **Chauffeur** | `youssef.tazi@transport.ma` | `test123` | `/ChauffeurLogin` | Chauffeur BUS-002 |
| **Chauffeur** | `karim.elfassi@transport.ma` | `test123` | `/ChauffeurLogin` | Chauffeur BUS-003 |
| **Tuteur** | `mohammed.alami@email.ma` | `test123` | `/TuteurLogin` | Tuteur avec 2 élèves |
| **Tuteur** | `fatima.benjelloun@email.ma` | `test123` | `/TuteurLogin` | Tuteur avec 2 élèves |

---

## 3. Résolution des Problèmes de Connexion

Si un compte affiche une erreur :
1. Assurez-vous que la base a bien été importée.
2. Accédez au script de mise à jour des comptes via votre navigateur :
   `http://localhost/backend/create_and_update_test_accounts.php`
3. Si le problème persiste pour l'Admin, exécutez la réparation auto :
   `http://localhost/backend/check_admin_account.php?fix=true`

---

## 4. Règles de Conformité des Données

**RÈGLE ABSOLUE : Les données affichées sur le site doivent correspondre EXACTEMENT à celles de la base de données.**

- Les listes des élèves doivent afficher uniquement les élèves actifs (`statut = 'Actif'`).
- Les absences affichées pour une date doivent correspondre précisément au nombre de présences/absences insérées en base.
- Toutes les actions de suppression (demandes d'inscriptions annuleś) du côté frontend déclenchent la requêtes `DELETE` sur la base. Les tuteurs peuvent annuler des demandes *"En attente"*, mais les incriptions définitives sont gérées par les administrateurs.

---

## 5. Tests et Requêtes SQL Utiles

Voici quelques tests (par Terminal ou SQLMyAdmin) pour s'assurer du bon fonctionnement en base :

**Test API Login Admin (Terminal Bash) :**
```bash
curl -X POST http://localhost/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@transport.ma\",\"mot_de_passe\":\"test123\",\"role\":\"admin\"}"
```

**Requête SQL - Vérifier l'affectation des bus :**
```sql
SELECT b.numero, b.capacite,
       CONCAT(c.prenom, ' ', c.nom) as chauffeur,
       CONCAT(r.prenom, ' ', r.nom) as responsable
FROM bus b
LEFT JOIN chauffeurs c ON b.chauffeur_id = c.id
LEFT JOIN responsables_bus r ON b.responsable_id = r.id
WHERE b.statut = 'Actif';
```

**Requête SQL - Vérifier les demandes en attente de paiement :**
```sql
SELECT d.id, d.montant_facture, e.nom, e.prenom, u.email as tuteur_email
FROM demandes d
INNER JOIN eleves e ON d.eleve_id = e.id
INNER JOIN tuteurs t ON e.tuteur_id = t.id
INNER JOIN utilisateurs u ON t.utilisateur_id = u.id
WHERE d.statut = 'En attente de paiement';
```

---
