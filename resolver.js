grille=grilleExpert2;
// Duplicate array
var grilleDepart = grille.slice();

// Renvoie l'ensemble des digits manquant sur une ligne
function findOnLine(line) {
    var already =[];
    for (var i=0;i<9;i++) {
        var digit = grille[line][i];
        if (digit != '.') already.push(parseInt(digit));
    }
    return buildMissing(already);
}

// Renvoie l'ensemble des digits manquant sur une colonne
function findOnColumn(col) {
    var already =[];
    for (var i=0;i<9;i++) {
        var digit = grille[i][col];
        if (digit != '.') already.push(parseInt(digit));
    }
    return buildMissing(already);
}

function buildMissing(already) {
    var result = [];
    for (var i=1;i<=9;i++) {
        if (already.indexOf(i) == -1) {
            result.push(i);
        }
    }
    return result;
}
function getRegionCoords(reg) {
    var x = 3 * (reg % 3);
    var y = 3 * (Math.floor(reg / 3));
    return [x,y];
}

function findOnRegion(reg) {
    var coords = getRegionCoords(reg);
    var x = coords[0];
    var y = coords[1];
    var already =[];
    for (var i=0;i<3;i++) {
        for (var j=0;j<3;j++) {
            var digit = grille[y+j][x+i];
            if (digit != '.') already.push(parseInt(digit));
        }
    }
    return buildMissing(already);
}

function displayGrille() {
    var myDiv = document.getElementById('grille');
    var content = "";
    content += "<table>";
    for (var y=0;y<9;y++) {
        var styleClass = (y == 2 || y == 5 ? 'bottomCell' : '');
        content += "<tr class='" + styleClass + "'>";
        for (var x=0;x<9;x++) {
            styleClass = x % 3 == 0 ? 'leftCell' : 'normalCell';
            content += "<td class='" + styleClass + "'>";
            var style = '';
            if (grille[y].charAt(x) != grilleDepart[y].charAt(x)) {
                style="<span style='color:#4466ff'>";
            }
            content += style;
            var value = grille[y].charAt(x)
            if (dispCandidats && value == '.') {
                content += "<span style='letter-spacing:0px'>("+solcase[y][x]+")</span>";
            } else {
                content += value;
            }
            if (style != '') content += '</span>';
            content += "</td>";
        }
        content += "</tr>";
    }
    content += "</table>";
    myDiv.innerHTML = content;
}


function intersect(a1, a2, a3) {
    return a1.filter(value => a2.includes(value) && a3.includes(value));
}

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

// En global pour debugger plus facilement
var solcase = [[]];

function resolve() {
    var solLines = [];
    var solColumns = [];
    var solRegions = [];
    for (var i=0;i<9;i++)
        solLines.push(findOnLine(i));
    for (var i=0;i<9;i++)
        solColumns.push(findOnColumn(i));
    for (var i=0;i<9;i++)
        solRegions.push(findOnRegion(i));

    // Now we cross results

    var found = false;
    // TODO: on fait avec un tableau, mais une map avec "x:y" en clé serait peut-être mieux adaptée]
    solcase = [[]];
    for (var i = 0; i < 9; i++) {
        solcase[i] = [];
        for (var j = 0; j < 9; j++) {
            solcase[i][j] = '';
        }
    }
    // 1ère tentative: on croise les données colonnes/lignes/régions
    for (var y=0;y<9;y++) {
        for (var x=0;x<9;x++) {
            if (grille[y][x] == '.') {
                var r = Math.floor(x / 3);
                r += 3 * Math.floor(y / 3);
                var sol = intersect(solLines[y], solColumns[x], solRegions[r]);
                if (sol.length == 1) {
                    //console.log("Case ["+(x+1)+","+(y+1)+"] = "+sol);
                    grille[y] = setCharAt(grille[y], x,sol);
                    found=true;
                }
                solcase[y][x] = sol;
            }
        }
    }

    // 2è tentative: on regarde si un chiffre est présent une unique fois dans une région
    for (var r=0;r<9;r++) {
        var coords = getRegionCoords(r);
        var x = coords[0];
        var y = coords[1];
        var complete = [];
        for (var j=0;j<3;j++) {
            for (var i=0;i<3;i++) {
                complete = complete.concat(solcase[y+j][x+i]);
            }
        }
        // Et on regarde si un chiffre n'apparait qu'une fois
        var counters = new Array(9).fill(0);
        for (var i=0;i<complete.length;i++) {
            var digit = complete[i];
            if (digit != '.')
                counters[digit]++;
        }
        var digit = counters.findIndex(value => value == 1);
        if (digit != -1) {
            // Reste à retrouver la case qui proposait seule cette valeur
            for (var j=0;j<3;j++) {
                for (var i=0;i<3;i++) {
                    if (solcase[y+j][x+i].indexOf(digit) != -1) {
                        //console.log("case = "+(x+i)+","+(y+j)+" avec solcase= "+solcase[y+j][x+i]);
                        grille[y+j] = setCharAt(grille[y+j], x+i,digit);
                        found = true;
                    }
                }
            }
        }

        if (!found) {
            // On check si un chiffre n'apparait que 2 fois pour identifier une colonne/ligne
            for (var idx=0;idx<counters.length;idx++) {
                if (counters[idx]==2) {
                    digit = idx;
                    console.log("On a trouvé le "+digit+" qui apparait 2 fois dans la région "+r+" x="+x);
                    var cases = [];
                    for (var j=0;j<3;j++) {
                        for (var i=0;i<3;i++) {
                            if (grille[y+j][x+i] == '.' && solcase[y+j][x+i].indexOf(digit) != -1) {
                                console.log("y="+(y+j) +" - x="+(x+i));
                                cases.push( {'x': x+i, 'y': y+j} );
                            }
                        }
                    }
                    if (cases[0].x == cases[1].x) {
                        console.log("même colonne ! ==> on le supprime sur toute la colonne sauf là cases="+JSON.stringify(cases));
                        var xx = cases[0].x;
                        for (var i=0;i<9;i++) {
                            if (i != cases[0].y && i != cases[1].y && grille[i][xx] == '.') {
                                console.log("on enleve le "+digit+" sur la case ("+xx+","+i);
                                solcase[i][xx] = solcase[i][xx].filter( v=> v != digit);
                            }
                        }
                    }
                    if (cases[0].y == cases[1].y) {
                        console.log("même ligne ! ==> on le supprime sur toute la ligne sauf là (TODO)");
                        /*
                        var yy = cases[0].y;
                        for (var i=0;i<9;i++) {
                            if (i != cases[0].x && i != cases[1].x && grille[yy][i] == '.') {
                                console.log("on enleve le "+digit+" sur la case ("+i+","+yy);
                                solcase[yy][i] = solcase[yy][i].filter( v=> v != digit);
                                console.log("solcase="+solcase[yy][i]);
                            }
                        }
                        */
                    }
                }
            };
        }
    }

    // 3è tentative: idem pour les lignes
    for (var l=0;l<9;l++) {
        var complete=[];
        for (var x=0;x<9;x++) {
            complete = complete.concat(solcase[l][x]);
        }

        // Et on regarde si un chiffre n'apparait qu'une fois
        var counters = new Array(9).fill(0);
        for (var i=0;i<complete.length;i++) {
            var digit = complete[i];
            if (digit != '.')
                counters[digit]++;
        }
        var digit = counters.findIndex(value => value == 1);
        if (digit != -1) {
            // Reste à retrouver la case qui proposait seule cette valeur
            //console.log("On a trouvé un "+digit+" pour x="+ (x) + " et y="+(y));
            for (var i=0;i<9;i++) {
                if (solcase[l][i].indexOf(digit) != -1) {
                    console.log("bingo ligne ! case = "+i+","+l+" avec solcase= "+solcase[l][i]);
                    grille[l] = setCharAt(grille[l], i,digit);
                    found = true;
                }
            }
        }
    }

    // 4è tentative: idem pour les colonnes
    for (var l=0;l<9;l++) {
        var complete=[];
        for (var y=0;y<9;y++) {
            complete = complete.concat(solcase[y][l]);
        }

        // Et on regarde si un chiffre n'apparait qu'une fois
        var counters = new Array(10).fill(0);
        for (var i=0;i<complete.length;i++) {
            var digit = complete[i];
            if (digit != '.')
                counters[digit]++;
        }
        var digit = counters.findIndex(value => value == 1);
        //console.log("On a le digit "+digit+" avec complete="+complete+" et counters="+counters+" sur la colonne "+l);
        if (digit != -1) {
            // Reste à retrouver la case qui proposait seule cette valeur
            //console.log("On a trouvé un "+digit+" pour x="+ (x) + " et y="+(y));
            for (var i=0;i<9;i++) {
                if (solcase[i][l].indexOf(digit) != -1) {
                    console.log("bingo colonne ! case = "+l+","+i+" avec solcase= "+solcase[i][l]);
                    grille[i] = setCharAt(grille[i], l,digit);
                    found = true;
                }
            }
        }
    }

    // 5è tentative: si on a un digit sur 2 emplacements possibles d'une ligne, on tente
    if (!found) {
        var bonnePosition=[];
        for (var y=0;y<9 && bonnePosition.length != 1;y++) {
            if (solLines[y].length <= 2) {
                // On tente chaque digit à chaque endroit
                var holes = findHolesLine(y);
                console.log("élimination sur ligne "+y);
                for (var i=0;i<solLines[y].length && bonnePosition.length != 1;i++) {
                    var d = solLines[y][i];

                    bonnePosition=[];
                    for (var h=0;h<holes.length;h++) {
                        var g2 = grille.slice();
                        var x = holes[h];
                        g2[y] = setCharAt(g2[y], x, d);
                        var grilleValide = estValide(g2);
                        console.log("Avec un "+d+" en "+x+","+y+", la grille est "+grilleValide);
                        if (grilleValide) {
                            bonnePosition.push(g2);
                        }
                    }
                    if (bonnePosition.length == 1) {
                        grille = bonnePosition[0];
                        console.log("Bingo par élimination sur ligne !");
                        found=true;
                    }

                }
            }
        }

        // 6è tentative: idem sur une colonne
        for (var x=0;x<9 && bonnePosition.length != 1;x++) {
            if (solColumns[x].length <= 2) {
                // On tente chaque digit à chaque endroit
                var holes = findHolesColumn(x);
                console.log("élimination sur colonne "+x+" holes="+holes);
                for (var i=0;i<solColumns[x].length && bonnePosition.length != 1;i++) {
                    var d = solColumns[x][i];

                    bonnePosition=[];
                    for (var h=0;h<holes.length;h++) {
                        var g2 = grille.slice();
                        var y = holes[h];
                        g2[y] = setCharAt(g2[y], x, d);
                        var grilleValide = estValide(g2);
                        console.log("Avec un "+d+" en "+x+","+y+", la grille est "+grilleValide);
                        if (grilleValide) {
                            bonnePosition.push(g2);
                        }
                    }
                    if (bonnePosition.length == 1) {
                        grille = bonnePosition[0];
                        console.log("Bingo par élimination sur colonne !");
                        found=true;
                    }

                }
            }
        }
    }

    if (found) {
        displayGrille();
    } else {
        alert('rien trouvé ! ');
    }
}

function findHolesLine(line) {
    var result = [];
    for (var x=0;x<9;x++) {
        if (grille[line][x] == '.')	result.push(x);
    }
    return result;
}

function findHolesColumn(col) {
    var result = [];
    for (var y=0;y<9;y++) {
        if (grille[y][col] == '.')	result.push(y);
    }
    return result;
}


function estValide(testGrille) {
    for (var digit=1;digit<=9;digit++) {
        // Colonne
        var foundIndex;
        var g = testGrille.slice();
        for (var x=0;x<9;x++) {
            foundIndex=-1;
            for (var y=0;y<9;y++) {
                if (g[y][x] == digit) { // On a trouvé notre digit
                    foundIndex=y;
                    break;
                }
            }
            if (foundIndex != -1) {
                // On marque toutes les cases vides comme fermée pour ce digit
                for (var y=0;y<9;y++) {
                    if (g[y][x] == '.') {
                        g[y] = setCharAt(g[y], x, 'X');
                    }
                }
            }
        }
        // Ligne
        for (var y=0;y<9;y++) {
            foundIndex=-1;
            for (var x=0;x<9;x++) {
                if (g[y][x] == digit) { // On a trouvé notre digit
                    foundIndex=y;
                    break;
                }
            }
            if (foundIndex != -1) {
                // On marque toutes les cases vides comme fermée pour ce digit
                for (var x=0;x<9;x++) {
                    if (g[y][x] == '.') {
                        g[y] = setCharAt(g[y], x, 'X');
                    }
                }
            }
        }

        // On teste que dans chaque région il reste au moins une case dispo
        for (var r=0;r<9;r++) {
            var coords = getRegionCoords(r);
            var ax=coords[0];
            var ay=coords[1];
            var found=false;
            for (var y=0;y<3 && !found;y++) {
                for (var x=0;x<3 && !found;x++) {
                    var value = g[ay+y][ax+x];
                    if (value == digit || value == '.') found = true;
                }
            }
            if (!found) {
                console.log("pas de "+digit+" dans la region "+r); return false;
            }

        }


    }
    return true;
}

var dispCandidats = false;

function displayCandidats() {
    dispCandidats = !dispCandidats;
    displayGrille();
}

