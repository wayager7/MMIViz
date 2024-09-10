//Défnition de deux variables globales
let fn = null;
let podiumFlag = false;

//Récupération des données
fetch('data.json').then(function (response) {
    response.json().then(function (data) {
        //Fonction pour le PopUp si la définition de l'écran est inférieur à 1024px
        popup();

        //Séléctionner uniquement les données voulues
        let gagnants = getGagnants(data, document.querySelector('select[name="trophy"]').value);

        //Création du graphique
        graphique(gagnants);

        //Création de la légende
        legende(data);

        //Si nous changons le graph à afficher
        document.querySelector('select[name="trophy"]').addEventListener('change', function (event) {

            //Récupération des données voulues
            gagnants = getGagnants(data, event.target.value);

            //Suppression de l'ancien graphique
            d3.select('g.graph').selectAll('g').selectAll('circle').remove()
            d3.select('g.graph').selectAll('g').selectAll("rect").transition().duration(300).attr('height', 0).remove();
            setTimeout(function () {
                d3.select('g.graph').selectAll('g').remove();
                d3.select('g.valeurs').selectAll('g').remove();
                //tracé du nouveau graphique
                graphique(gagnants);
            }, 300);
        });
    });
});

//Fonction pour récupérer les données voulues
function getGagnants(data, cas) {
    let gagnants = [];
    let valeur;
    //Pour chaque année
    data.forEach(element => {
        let gagnant = [];
        //Pour chaque université
        element.result.forEach((univ) => {
            valeur = 0;
            //Si nous voulons toutes les places
            if (cas == 1) {
                valeur = univ.charts[0] + univ.charts[1] + univ.charts[2];
            }
            //Si nous voulons les premières places
            else {
                valeur = univ.charts[0];
            }
            //Si le nombre de trophées est égal au nombre de trophés remportés par le gagnant de l'année
            if (valeur == element.winner[cas]) {
                //Mettre le nombre de trophée qui sera exploité à la case 3 du tableau
                univ.charts[3] = valeur;
                //Ajouter l'université au tableau des gagnants de l'année
                gagnant.push(univ);
            }
        })
        //Ajouter le tableau des gagnants de l'année au tableau des gagnants
        gagnants.push(gagnant);
    });
    //Retourner le tableau des gagnants
    return gagnants;
}

//Fonction pour créer le graphique
function graphique(gagnants) {
    //Connaître l'échelle du graphique
    const cas = document.querySelector('select[name="trophy"]').value;
    const echelle = { valeurs: [[1, 2, 3], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]] };

    //création d'un groupe par année
    const barre = d3.select('g.graph').selectAll('g')
        .data(gagnants)
        .join('g')
        .attr('id', (dataG, i) => 2015 + i)
        .attr('transform', (dataG, i) => `translate(${(5 + (300 / 9) * i)}, 0), scale(1, -1)`)
        .selectAll('g')
        //création d'un groupe par université
        .data(dataG => dataG)
        .join('g')
        .attr('class', dataU => dataU.university.replaceAll(' ', '').replaceAll('é', 'e').replaceAll('ê', 'e').replaceAll('ô', 'o').toLowerCase())
        .attr('transform', (dataU, i, dataG) => `translate(${((300 / 9 - 5) / dataG.length) * i}, 0)`);

    //création d'une barre par université, avec une épaisseur partagée en fonction du nombre de gagnants et une hauteur de 0
    barre.append('rect')
        .attr('width', (dataU, i, dataG) => (300 / 9 - 5) / dataG.length)
        .attr('height', (dataU, i, dataG) => (300 / 9 - 5) / dataG.length / 2)
        .attr('fill', dataU => dataU.color)

    //Arrondir le bout des barres
    barre.append('circle')
        .attr('cx', (dataU, i, dataG) => (300 / 9 - 5) / dataG.length / 2)
        .attr('cy', (dataU, i, dataG) => (300 / 9 - 5) / dataG.length / 2)
        .attr('r', (dataU, i, dataG) => (300 / 9 - 5) / dataG.length / 2)
        .attr('fill', (dataU) => dataU.color)

    //Animation des barres jusqu'à la bonne valeur
    setTimeout(function () {
        barre.select('rect').transition().duration(600).attr('height', dataU => dataU.charts[3] * (160 / echelle.valeurs[cas].length))
        barre.select("circle").transition().duration(600).attr('cy', dataU => dataU.charts[3] * (160 / echelle.valeurs[cas].length))
        setTimeout(function () { podiumFlag = false; updateTitre();}, 600)
    }, 10);

    //Au survole des barres, rendre les barres des autres université que celle survolée transparentes et afficher une infobulle
    barre.on('mouseenter', function (event, dataU) {
        barre.transition().duration(500).style('opacity', 0.2);
        d3.selectAll("g." + dataU.university.replaceAll(' ', '').replaceAll('é', 'e').replaceAll('ê', 'e').replaceAll('ô', 'o').toLowerCase()).transition().duration(300).style('opacity', 1);
        infoBulle(event, dataU);
    });

    //Rétablir l'opacité des barres et supprimer l'infobulle
    barre.on('mouseleave', function (event, dataU) {
        barre.transition().duration(500).style('opacity', 1);
        infoBulle();
    });

    //Ajout des années sur l'axe des abscisses
    d3.select('svg')
        .selectAll('g.graph>g')
        .append('text')
        .text((dataG, i) => 2015 + i)
        .attr('transform', 'scale(0.8, -0.8)')
        .attr('y', 12.5)
        .attr('x', 2.25)

    //Création d'un groupe pour chacune des valeurs de l'axe des ordonnées
    const valeur = d3.select('g.valeurs')
        .selectAll('g')
        .data(echelle.valeurs[cas])
        .join('g')

    //Ajout des lignes sur l'axe des ordonnées
    valeur.append('line')
        .attr('x1', -5)
        .attr('x2', 300)
        .attr('y1', data => data * (160 / echelle.valeurs[cas].length))
        .attr('y2', data => data * (160 / echelle.valeurs[cas].length))
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5 5')
        .attr('transform', 'scale(1, -1)')

    //Ajout des valeurs sur l'axe des ordonnées
    valeur.append('text')
        .text(data => data)
        .attr('y', data => (data * (160 / echelle.valeurs[cas].length) - 5) * -1)
        .attr('x', -13)
        .style('text-anchor', 'middle')
}

//Création de la légende
function legende(data) {
    //Pour chaque université
    data[0].result.forEach((univ) => {
        //Ajouter un paragraphe avec le nom de l'université et la couleur de l'université dans une variable CSS
        document.querySelector('section.universite').innerHTML += `<p class="${univ.university.replaceAll(' ', '').replaceAll('é', 'e').replaceAll('ê', 'e').replaceAll('ô', 'o').toLowerCase()}" style="  --color: ${univ.color};">${univ.university}</p>`;
    });
    //Ajouter les évènements sur les paragraphes
    eventLegende(data);
}

//Ajout des évènements sur les paragraphes de la légende
function eventLegende(donnees) {
    //Sélection de tous les paragraphes
    document.querySelectorAll('section.universite p').forEach((univ) => {

        //Au survol d'un paragraphe
        univ.addEventListener('mouseenter', function (event) {
            //Si nous ne sommes pas sur le graphique style podium
            if (!podiumFlag) {
                //Rendre les barres des autres université que celle survolée transparentes
                d3.selectAll('g.graph g').selectAll('g').transition().duration(500).style('opacity', 0.2);
                d3.selectAll("g." + event.target.className).transition().duration(300).style('opacity', 1);
            }
        });

        //Quand nous quittons un paragraphe, rétablir l'opacité des barres
        univ.addEventListener('mouseleave', function (event) {
            if (!podiumFlag) {
                d3.select('g.graph').selectAll('*').transition().duration(500).style('opacity', 1);
            }
        });

        //Au click sur un paragraphe, supprimer le graphique actuel et créer le graphique style podium
        univ.addEventListener('click', function (event) {
            d3.select('g.graph').selectAll('g').selectAll('circle').remove()
            d3.select('g.graph').selectAll('g').selectAll("rect").transition().duration(300).attr('height', 0).remove();
            setTimeout(function () {
                d3.select('g.graph').selectAll('g').remove();
                d3.select('g.valeurs').selectAll('g').remove();
                tracePodium(event.target.className, JSON.parse(JSON.stringify(donnees)));
            }, 300);
        });
    });
}

//Création du graphique style podium
function tracePodium(univ, data) {
    podiumFlag = true;
    let podium = [];
    const copydata = JSON.parse(JSON.stringify(data));
    //Pour chaque année
    data.forEach(function (anneeData) {
        //Récupérer les données de l'université sélectionnée
        anneeData.result.forEach(function (resultat) {
            if (resultat.university.replaceAll(' ', '').replaceAll('é', 'e').replaceAll('ê', 'e').replaceAll('ô', 'o').toLowerCase() == univ) {
                updateTitre(resultat.university);
                //Ajouter les données de l'université sélectionnée au tableau podium
                podium.push(resultat);
            }
        });
    })

    //Création d'un groupe par année
    const annee = d3.select('g.graph').selectAll('g')
        .data(podium)
        .join('g')
        .attr('id', (dataA, i) => 2015 + i)
        .attr('transform', (dataA, i) => `translate(${(5 + (300 / 9) * i)}, 0), scale(1, -1)`)
        .attr('class', (dataU) => dataU.university.replaceAll(' ', '').replaceAll('é', 'e').replaceAll('ê', 'e').replaceAll('ô', 'o').toLowerCase());

    //Création d'une ligne pour séparer les années
    annee.append('line')
        .attr('x1', -2.5)
        .attr('x2', -2.5)
        .attr('y1', 0)
        .attr('y2', 160)
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)

    //Création d'un groupe par "marche du podium"
    const barrePodium = annee.selectAll('g')
        .data(dataA => dataA.charts.splice(0, 3))
        .join('g')
        .attr('transform', (dataU, i) => `translate(${((300 / 9 - 5) / 3) * i}, 0)`);

    //Création des barres
    barrePodium.append('rect')
        .attr('width', (300 / 9 - 5) / 3)
        .attr('height', 2)
        .attr('fill', (data, i) => {
            switch (i) {
                case 0:
                    return 'gold';
                case 1:
                    return 'silver';
                case 2:
                    return 'coral';
            }
        });

    //Création d'un cercle pour arrondir le bout des barres
    barrePodium.append('circle')
        .attr('cx', (dataU, i, dataG) => (300 / 9 - 5) / 6)
        .attr('cy', (dataU, i, dataG) => (300 / 9 - 5) / 6)
        .attr('r', (dataU, i, dataG) => (300 / 9 - 5) / 6)
        .attr('fill', (data, i) => {
            if (data == 0) {
                return 'none';
            }
            switch (i) {
                case 0:
                    return 'gold';
                case 1:
                    return 'silver';
                case 2:
                    return 'coral';
            }
        })

    //Au survol des barres, afficher une infobulle
    annee.on('mouseenter', function (event) {
        infoBulle(event, barrePodium);
    });

    //Quand nous quittons les barres, supprimer l'infobulle
    annee.on('mouseleave', function () {
        infoBulle();
    });

    //Animation des barres jusqu'à la bonne valeur
    setTimeout(function () {
        barrePodium.select('rect').transition().duration(600).attr('height', dataU => dataU * (160 / 4) + 2);
        barrePodium.select("circle").transition().duration(600).attr('cy', dataU => dataU * (160 / 4));
    }, 10)

    //Ajout des années sur l'axe des abscisses
    d3.select('svg')
        .selectAll('g.graph>g')
        .append('text')
        .text((dataG, i) => 2015 + i)
        .attr('transform', 'scale(0.8, -0.8)')
        .attr('y', 12.5)
        .attr('x', 2.25)

    //Création d'un groupe pour chacune des valeurs de l'axe des ordonnées
    const valeur = d3.select('g.valeurs')
        .selectAll('g')
        .data([1, 2, 3, 4])
        .join('g')

    //Ajout des lignes sur l'axe des ordonnées
    valeur.append('line')
        .attr('x1', -5)
        .attr('x2', 300)
        .attr('y1', data => data * (160 / 4))
        .attr('y2', data => data * (160 / 4))
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5 5')
        .attr('transform', 'scale(1, -1)')

    //Ajout des valeurs de l'axe des ordonnées
    valeur.append('text')
        .text(data => data)
        .attr('y', data => (data * (160 / 4) - 5) * -1)
        .attr('x', -13)
        .style('text-anchor', 'middle');

    //Si nous cliquons n'importe où sur la page, réinitialiser le graphique
    setTimeout(function () {
        fn = () => resetGraph(copydata, event);
        document.querySelector('body').addEventListener('click', fn);
    }, 300);
}

//Réinitialisation du graphique
function resetGraph(copydata, e) {
    //Si l'élément cliqué n'est pas un paragraphe
    if (e.target.tagName != "P") {
        //Supprimer le graphique actuel
        d3.select('g.graph').selectAll('g').selectAll('circle').remove()
        d3.select('g.graph').selectAll('g').selectAll("rect").transition().duration(300).attr('height', 0).remove();
        setTimeout(function () {
            d3.select('g.graph').selectAll('g').remove();
            d3.select('g.valeurs').selectAll('g').remove();

            //Créer le graphique de base
            graphique(getGagnants(copydata, document.querySelector('select[name="trophy"]').value));

            //Supprimer l'évènement de réinitialisation
            document.querySelector('body').removeEventListener('click', fn);
            setTimeout(function () {
                fn = null;
            }, 50);
        }, 300);
    }
    //Si l'élément cliqué est un paragraphe, réinitialiser l'évènement de réinitialisation
    else {
        document.querySelector('body').removeEventListener('click', fn);
        setTimeout(function () {
            fn = null;
        }, 50);
    }
}

//fontion pour faire disparaitre le popup au clique sur le bouton
function popup() {
    document.querySelector('.btnPopup').addEventListener('click', function (event) {
        document.querySelector('.popup').style.display = 'none';
    });
}

//Fonction pour afficher une infobulle
function infoBulle(event, infos) {
    //Si l'infobulle n'existe pas, la créer
    if (!document.querySelector('.infoBulle')) {
        var infoBulle = document.createElement('div');
        infoBulle.classList.add('infoBulle');
        document.body.appendChild(infoBulle);
    }

    //Sélectionner l'infobulle
    var bulle = document.querySelector('.infoBulle')

    //Si la fonction a été appelée sans paramètre, masquer l'infobulle
    if (!infos) { bulle.onmousemove = ''; bulle.style.display = 'none'; return }

    //Tester le style de graphique
    if (!podiumFlag) {
        //Afficher l'infobulle avec les informations de la barre survolée
        bulle.innerHTML = "<h3>" + infos.university + "</h3><p>Année : " + event.target.parentElement.id + "</p>" + getTexte(infos) + "</p>";
        bulle.style.display = 'block'
        //Positionner l'infobulle à la position de la souris
        event.currentTarget.onmousemove = function (event) {
            bulle.style.top = event.clientY - 20 + 'px'
            bulle.style.left = event.clientX + 13 + 'px'
        }
    }
    else {
        //Afficher l'infobulle avec les informations de l'année survolée
        bulle.innerHTML = "<h3>" + infos._parents[0].__data__.university + "</h3><p>Année : " + event.target.id + "</p>" + getTexte(infos) + "</p>";
        bulle.style.display = 'block'
        event.currentTarget.onmousemove = function (event) {
            //Positionner l'infobulle à la position de la souris
            bulle.style.top = event.clientY - 20 + 'px'
            bulle.style.left = event.clientX + 13 + 'px'
        }
    }

    //Fonction pour récupérer le texte de l'infobulle
    function getTexte(infos) {
        //Tester le style de graphique
        if (podiumFlag) {
            let first;
            let second;
            let third;

            //Tester le nombre (règle de français)
            if (infos._groups[event.target.id - 2015][0].__data__ == 1) {
                first = "première place";
            }
            else {
                first = "premières places";
            }
            if (infos._groups[event.target.id - 2015][1].__data__ == 1) {
                second = "deuxième place";
            }
            else {
                second = "deuxièmes places";
            }
            if (infos._groups[event.target.id - 2015][2].__data__ == 1) {
                third = "troisième place";
            }
            else {
                third = "troisièmes places";
            }

            //Retourner le texte de l'infobulle
            return ("Cette année, l'université à remportée : <ul><li><span class=\"bold\">" + infos._groups[event.target.id - 2015][0].__data__ + "</span> " + first + "</li><li><span class=\"bold\">" + infos._groups[event.target.id - 2015][1].__data__ + "</span> " + second + "</li><li><span class=\"bold\">" + infos._groups[event.target.id - 2015][2].__data__ + "</span> " + third + "</li></ul>")
        }
        //Tester le graphique sélectionné
        if (document.querySelector('select[name="trophy"]').value == 0) {
            //Tester le nombre (règle de français) puis retourner le texte de l'infobulle
            if (infos.charts[0] == 1) { return ("L'université à remportée <span class=\"bold\">" + infos.charts[0] + "</span> première place") }
            else {
                return ("L'université à remportée <span class=\"bold\">" + infos.charts[0] + "</span> premières places")
            }
        }
        else {
            //Tester le nombre (règle de français) puis retourner le texte de l'infobulle
            const valeur = infos.charts[0] + infos.charts[1] + infos.charts[2];
            if (valeur == 1) { return ("L'université à remportée <span class=\"bold\">" + valeur + "</span> trophée toutes places confondues") }
            else {
                return ("L'université à remportée <span class=\"bold\">" + valeur + "</span> trophées toutes places confondues")
            }
        }
    }
}

//Fonction pour mettre à jour le titre
function updateTitre(univ) {
    const titre = document.querySelector('.titreGraph');
    //Test le type de graphique
    if (podiumFlag){
        titre.innerHTML = "Nombre de trophées gagnés par "+ univ +" par années";
    }
    else {
        //Test le graphiqque sélectionné
        if (document.querySelector('select[name="trophy"]').value == 0) {
            titre.innerHTML = "Universités ayant gagné le plus de premières places par années";
        }
        else {
            titre.innerHTML = "Universités ayant gagné le plus de trophées, toutes places confondus, par années";
        }
    }
}