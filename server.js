var express = require('express'),
    app=express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML 
    fs = require('fs');

app.use(express.static(__dirname + '/public'));

//Initialisation des varables serveurs
var liste =new Array();//Liste des pseudos
var nbr = new Number();//Nombre de connectés
var hiscore =new Number();//Hiscore global
var memoire= new Array();//Liste des 50 derniers messages
var liste_couleur=['aqua','chartreuse','red','silver','LightSkyBlue','yellow','cornsilk','DeepPink','DarkOrange','lavender'];//Liste des couleurs possibles (10 pour l'instant)
var pseudoHiscore='ordi';//Pseudo du détenteur du hiscore
var couleurHiscore='gray';//Couleur du détenteur du hiscore (par défaut ordi)
var compteurPartie=0;
var compteurConnexions=0;
hiscore=10;//Premier hiscore au lancement du serveur

// Chargement de la page 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/spaceWar.html'); 
});

// Quand un client se connecte...
io.sockets.on('connection', function (socket, pseudo) {
    socket.on('petit_nouveau', function(pseudo) {
        pseudo = ent.encode(pseudo);//protège le code, évite de recevoir du JS
        
        socket.pseudo = pseudo;
        socket.couleur= liste_couleur[compteurConnexions%10];//Choix de la couleur
        liste.push({pseudo :pseudo, couleur:socket.couleur});
        ++nbr;//Mise à jour du compteur
        ++compteurConnexions;
        socket.broadcast.emit('nouveau_client', {pseudo :socket.pseudo, couleur : socket.couleur});//On envoie l'info de connexion à tout le monde
        socket.emit('MAJ_liste', liste);
        socket.emit('couleur',socket.couleur );//Envoie de sa couleur au nouveau
        socket.broadcast.emit('MAJ_liste', liste);//Nouvelle liste de pseudo
        socket.emit('MAJ_nbr',nbr);
        socket.broadcast.emit('MAJ_nbr',nbr);
        socket.emit('Memoire_chat',memoire);//Envoie des anciens messages au nouveau
        socket.emit('partage_hiscore',{hiscore :hiscore, pseudo : pseudoHiscore, couleur : couleurHiscore});//Envoie du hiscore au nouveau
        socket.broadcast.emit('MAJ_CompteurConnexion',compteurConnexions);
        socket.emit('MAJ_CompteurConnexion',compteurConnexions);
        socket.emit('MAJ_Parties',compteurPartie);
    });
    
    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et sa couleur et on les transmet aux autres personnes, on met aussi à jour la mémoire
    socket.on('message', function (message) {
        memoire.push({pseudo:socket.pseudo, message:message, couleur :socket.couleur});
        if (memoire.length>50){
            memoire.shift();
        }
        message = ent.encode(message);
        socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message, couleur : socket.couleur});
    });
    
    //Déconnexion d'un membre
    socket.on('disconnect', function(){
        if(nbr>0){
            --nbr;
        };
        indice = liste.indexOf(socket.pseudo);
        liste.splice(indice,1); //à partir de cet indice on supprime 1 element
        socket.broadcast.emit('MAJ_liste', liste); //tout le monde met à jour
        socket.broadcast.emit('MAJ_nbr',nbr);
        socket.broadcast.emit('disconnected', {pseudo :socket.pseudo, couleur : socket.couleur});
    });
    
    //Nouveau hiscore reçu
    socket.on('new_hiscore', function(val){
        hiscore=val;
        pseudoHiscore=socket.pseudo;
        couleurHiscore=socket.couleur
        socket.broadcast.emit('partage_hiscore',{hiscore :hiscore, pseudo : pseudoHiscore, couleur : couleurHiscore});
    });
    
    //Nouveau score reçu
    socket.on('new_score', function(val){
        socket.broadcast.emit('partage_score',{score :val, pseudo : pseudo=socket.pseudo, couleur : socket.couleur});
        socket.emit('partage_score',{score :val, pseudo : pseudo=socket.pseudo, couleur : socket.couleur});
    });
    
    socket.on('AjoutPartieJouee',function(val){
        ++compteurPartie;
        socket.emit('MAJ_Parties',compteurPartie);
        socket.broadcast.emit('MAJ_Parties',compteurPartie);
    });
 }); 

server.listen(8080);

