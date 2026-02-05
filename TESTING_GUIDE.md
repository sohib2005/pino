# 🧪 Guide de Test Rapide - Système de Commandes

## Prérequis
- ✅ Backend démarré sur http://localhost:3001
- ✅ Frontend démarré sur http://localhost:3000
- ✅ Base de données migrée et seed appliqué

## 🎯 Scénario de Test Complet

### 1. Connexion Client
1. Aller sur http://localhost:3000/login
2. Se connecter avec :
   - **Téléphone:** `50770418`
   - **Mot de passe:** `password123`

### 2. Navigation dans la Boutique
1. Cliquer sur **"Boutique"** dans le menu
2. Observer les produits disponibles :
   - T-shirt Premium Pino
   - Sweat à Capuche Premium
   - Mug Céramique Premium

### 3. Ajouter des Articles au Panier
1. Cliquer sur un produit (ex: T-shirt Premium Pino)
2. Sélectionner :
   - **Couleur:** Blanc
   - **Taille:** M
   - **Quantité:** 2
3. Cliquer **"Ajouter au panier"**
4. Vérifier la notification de succès
5. Répéter pour d'autres produits

### 4. Vérifier le Panier
1. Cliquer sur l'icône **panier** dans le header
2. Vérifier :
   - ✅ Les articles ajoutés sont affichés
   - ✅ Les images sont correctes
   - ✅ Les quantités sont bonnes
   - ✅ Le total est calculé

### 5. Modifier le Panier
1. Utiliser les boutons **+** et **-** pour changer les quantités
2. Cliquer sur **X** pour supprimer un article
3. Observer que le total se met à jour

### 6. Passer une Commande
1. Dans le panier, cliquer **"Passer la commande"**
2. Remplir le formulaire :
   ```
   Adresse: Rue de la Liberté, Djerba
   Téléphone: 50770418
   Notes: Livraison après 18h (optionnel)
   ```
3. Cliquer **"Confirmer"**
4. Vérifier :
   - ✅ Message de succès avec numéro de commande
   - ✅ Redirection vers /profile?tab=orders

### 7. Vérifier les Commandes Client
1. Sur `/orders` ou onglet commandes du profil
2. Observer :
   - ✅ La commande apparaît avec statut **"En attente"** (jaune)
   - ✅ Tous les détails sont corrects
   - ✅ Le bouton "Annuler la commande" est visible

### 8. Vérifier le Stock (Backend)
Option A - Via l'API :
```bash
curl http://localhost:3001/products/variants/1/stock
```

Option B - Via Prisma Studio :
```bash
cd Backend
npx prisma studio
```
1. Ouvrir `product_variants`
2. Vérifier que le stock a diminué

### 9. Annuler une Commande (Client)
1. Sur `/orders`
2. Cliquer **"Annuler la commande"**
3. Confirmer
4. Vérifier :
   - ✅ Statut devient **"Annulé"** (rouge)
   - ✅ Stock restauré (vérifier via Prisma Studio)

### 10. Interface Admin - Connexion
1. Se déconnecter (menu profil > Déconnexion)
2. Se reconnecter avec :
   - **Téléphone:** `11111111`
   - **Mot de passe:** `password123`

### 11. Tableau de Bord Admin
1. Cliquer sur **"Tableau de bord"** ou aller sur `/admin/dashboard`
2. Observer les statistiques générales

### 12. Gestion des Commandes Admin
1. Cliquer sur **"Commandes"** dans le menu admin
2. Observer :
   - ✅ Statistiques en haut (Total, En attente, En cours, Livrées, Revenu)
   - ✅ Filtres par statut
   - ✅ Tableau avec toutes les commandes

### 13. Filtrer les Commandes
1. Cliquer sur **"En Attente"**
2. Observer que seules les commandes en attente s'affichent
3. Tester les autres filtres

### 14. Changer le Statut d'une Commande
1. Dans le tableau, sélectionner un nouveau statut dans le menu déroulant
2. Observer :
   - ✅ Message de succès
   - ✅ Badge de couleur mis à jour
   - ✅ Statistiques actualisées

### 15. Voir les Détails d'une Commande
1. Cliquer sur **"Détails"** d'une commande
2. Vérifier le modal avec :
   - ✅ Informations client complètes
   - ✅ Liste détaillée des articles
   - ✅ Images des produits
   - ✅ Total de la commande
   - ✅ Possibilité de changer le statut

### 16. Créer une Nouvelle Commande (Scénario Complet)
1. Se déconnecter et se reconnecter en tant que client
2. Aller sur `/boutique`
3. Ajouter plusieurs produits :
   - T-shirt Blanc M x2
   - Sweat Noir M x1
   - Mug 330ml x3
4. Aller sur `/cart`
5. Vérifier le total (devrait être calculé correctement)
6. Passer la commande avec une adresse différente
7. Aller voir dans `/orders` - nouvelle commande visible
8. Retourner sur l'admin et vérifier que la commande apparaît

## ✅ Points de Vérification

### Panier
- [ ] Ajout au panier fonctionne
- [ ] Quantités modifiables
- [ ] Suppression d'articles fonctionne
- [ ] Total calculé correctement
- [ ] Vider le panier fonctionne

### Commandes
- [ ] Création de commande réussie
- [ ] Numéro de commande unique généré
- [ ] Stock réduit automatiquement
- [ ] Panier vidé après commande
- [ ] Commandes visibles dans `/orders`

### Statuts
- [ ] EN_ATTENTE par défaut
- [ ] Changement de statut fonctionne (admin)
- [ ] Couleurs correctes pour chaque statut
- [ ] Filtrage par statut fonctionne

### Annulation
- [ ] Annulation possible si EN_ATTENTE
- [ ] Stock restauré après annulation
- [ ] Statut passe à ANNULE
- [ ] Impossible d'annuler si LIVRE

### Admin
- [ ] Statistiques correctes
- [ ] Toutes les commandes visibles
- [ ] Informations client affichées
- [ ] Modal de détails complet

## 🐛 Tests d'Erreur

### 1. Stock Insuffisant
1. Ajouter un produit au panier avec quantité maximale disponible
2. Essayer d'ajouter encore le même produit
3. Vérifier : ❌ Message "Stock insuffisant"

### 2. Panier Vide
1. Vider complètement le panier
2. Essayer de passer une commande
3. Vérifier : ❌ Message "Panier vide"

### 3. Champs Manquants
1. Dans `/cart`, cliquer "Passer la commande"
2. Ne pas remplir l'adresse
3. Cliquer "Confirmer"
4. Vérifier : ❌ Message de validation HTML5

### 4. Annulation Impossible
1. En tant qu'admin, changer une commande en "LIVRE"
2. Se connecter en tant que client
3. Essayer d'annuler cette commande
4. Vérifier : ❌ Bouton "Annuler" n'est pas visible

## 📊 Vérifications Base de Données

### Via Prisma Studio
```bash
cd Backend
npx prisma studio
```

#### Tables à vérifier :
1. **carts** - Un panier par utilisateur
2. **cart_items** - Articles dans les paniers
3. **orders** - Liste des commandes
4. **order_items** - Détails des articles commandés
5. **stock_movements** - Historique des mouvements de stock

#### Exemple de vérification :
```sql
-- Après une commande, vérifier :
SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 5;

-- Vérifier le stock d'un produit :
SELECT sku, stock FROM product_variants WHERE id = 1;

-- Compter les commandes :
SELECT status, COUNT(*) FROM orders GROUP BY status;
```

## 🎉 Scénario de Succès Complet

Si tous les points suivants sont ✅, le système fonctionne parfaitement :

1. ✅ Produits affichés dans la boutique
2. ✅ Ajout au panier avec vérification stock
3. ✅ Modification du panier en temps réel
4. ✅ Passation de commande fluide
5. ✅ Stock diminué automatiquement
6. ✅ Commandes visibles côté client
7. ✅ Statuts avec code couleur correct
8. ✅ Annulation avec remise en stock
9. ✅ Interface admin complète et fonctionnelle
10. ✅ Filtrage et recherche opérationnels
11. ✅ Statistiques précises
12. ✅ Changement de statut en temps réel

## 📝 Notes

- Les IDs utilisateur sont temporaires (en attendant JWT)
- Utilisez Prisma Studio pour vérifier la base de données
- Les mouvements de stock sont enregistrés pour audit
- Le numéro de commande est unique et auto-généré
- CORS est activé sur le backend pour le développement

## 🚀 Commandes Utiles

```bash
# Backend
cd Backend
npm run start:dev        # Démarrer le serveur
npx prisma studio        # Ouvrir Prisma Studio
npx prisma migrate reset # Réinitialiser la DB

# Frontend  
cd Frontend
npm run dev              # Démarrer Next.js

# Tests API (avec curl)
# Récupérer le panier
curl http://localhost:3001/cart -H "x-user-id: 024ec841-36c9-4a6c-8173-c1c423e2095b"

# Ajouter au panier
curl -X POST http://localhost:3001/cart/add \
  -H "Content-Type: application/json" \
  -H "x-user-id: 024ec841-36c9-4a6c-8173-c1c423e2095b" \
  -d '{"variantId": 1, "quantity": 2}'

# Récupérer toutes les commandes (admin)
curl http://localhost:3001/orders/all
```

Bon test ! 🎯
