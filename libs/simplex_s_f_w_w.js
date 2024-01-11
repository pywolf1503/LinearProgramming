function getInput() {
    var method = document.getElementById('Method').value;
    var num_variables = parseInt(document.getElementById("num-variables").value);
    var num_constraints = parseInt(document.getElementById("num-constraints").value);
    var optimization_type = document.getElementById("obj-type").value;
    var objective_function = [];
    var options = [];
    for (var i = 1; i <= num_variables; i++) {
        objective_function.push(parseFloat(document.getElementById("obj-coeff-" + i).value));
    }
    for(var i = 1; i<=num_constraints;i++){
        options.push(document.getElementById("constraint-type-" + i).value);
    }
    var constraints = [];
    for (var i = 1; i <= num_constraints; i++) {
        var constraint_row = [];
        for (var j = 1; j <= num_variables; j++) {
            constraint_row.push(parseFloat(document.getElementById("constraint-coeff-x" + j + "-" + i).value));
        }
        constraint_row.push(parseFloat(document.getElementById("constraint-bi-" + i).value));
        constraints.push(constraint_row);
    }
    return [num_variables, num_constraints, optimization_type, objective_function, constraints,options,method];
}
function initializeSimplexTableau(num_vars, num_cons, opt_type, obj_func, constraints) {
    var tableau = new Array(num_cons + 1).fill(0).map(function () {
        return new Array(num_vars + num_cons + 1).fill(0);
    });
    tableau[0].fill(0);
    tableau[0].splice(0, num_vars, ...obj_func);
    tableau[0].splice(num_vars, num_cons, ...Array(num_cons).fill(0));
    for (var i = 0; i < num_cons; i++) {
        tableau[i + 1].fill(0);
        tableau[i + 1].splice(0, num_vars, ...constraints[i].slice(0, num_vars));
        tableau[i + 1][num_vars + i] = 1;
        tableau[i + 1][tableau[0].length - 1] = constraints[i][constraints[i].length - 1];
    }
    return tableau;
}
function initializeBigMTableau(num_vars, num_cons, opt_type, obj_func, constraints,options){
    var initial_tableau = [];
    var initial_tableau_constraints = [];
    var forbidden_indexes = [];
    var modified_constraint = [];
    var new_objective_function = [...obj_func];
    var non_basic_variables = [];
    var basic_variables = [];
    const M = 1000.0;
    var Bi = 0.0;
    for(let i = 1; i <= num_vars;i++){
        non_basic_variables.push("X" + i);
    }
    for(var i = 0; i < constraints.length;i++){
        if(options[i] == "<="){
            modified_constraint.push(constraints[i].slice());
        }
        if(options[i] == ">=" || options[i] == "="){
            var modified_constraint_row =  [];
            for(var j = 0; j < constraints[0].length - 1; j++){
                modified_constraint_row.push(opt_type = "max" ? constraints[i][j] * M : constraints[i][j] * M * -1);
            }
            modified_constraint_row.push(constraints[i][constraints[i].length - 1]);
            modified_constraint.push(modified_constraint_row);
        }
        initial_tableau_constraints.push(constraints[i].slice());
    }
    for(var i = 0; i < modified_constraint.length; i++){
        if(options[i] == "<="){
            for(var j = 0; j < modified_constraint.length; j++){
                if(i == j){
                    modified_constraint[j].splice(modified_constraint[j].length - 1,0,1);
                    initial_tableau_constraints[j].splice(initial_tableau_constraints[j].length-1,0,1);
                    non_basic_variables.push("E" + (j+1));
                    basic_variables.push("E" + (j+1));
                }
                else{
                    modified_constraint[j].splice(modified_constraint[j].length - 1,0,0);
                    initial_tableau_constraints[j].splice(initial_tableau_constraints[j].length-1,0,0);
                }
            }
        }
        else if(options[i] == ">="){
            for(var j = 0; j < modified_constraint.length; j++){
                if(i == j){
                    modified_constraint[j].splice(modified_constraint[j].length - 1,0,M * -1);
                    initial_tableau_constraints[j].splice(initial_tableau_constraints[j].length-1,0,-1);
                    non_basic_variables.push("E" + (j+1));
                }
                else{
                    modified_constraint[j].splice(modified_constraint[j].length - 1,0,0);
                    initial_tableau_constraints[j].splice(initial_tableau_constraints[j].length-1,0,0);
                }
            }
        }
    }
    for(var i = 0; i < modified_constraint.length; i++){
        if(options[i] == ">=" || options[i] == "="){
            for(var j = 0; j < modified_constraint.length;j++){
                if(i == j){
                    modified_constraint[j].splice(modified_constraint[j].length - 1,0,1);
                    initial_tableau_constraints[j].splice(initial_tableau_constraints[j].length-1,0,1);
                    non_basic_variables.push("A" + (j+1));
                    basic_variables.push("A" + (j+1));
                    forbidden_indexes.push(modified_constraint[j].length - 2);
                }
                else{
                    modified_constraint[j].splice(modified_constraint[j].length - 1,0,0);
                    initial_tableau_constraints[j].splice(initial_tableau_constraints[j].length-1,0,0);
                }
            }
        }
    }
    for(let i = 0; i < modified_constraint.length; i++){
        if(options[i] == ">=" || options[i] == "=") {
            for(let j = 0; j < modified_constraint[i].length - 1; j++){
                if (!forbidden_indexes.includes(j)) {
                    if(j < obj_func.length){
                        new_objective_function[j] = new_objective_function[j] + modified_constraint[i][j];
                    }
                    else{
                        if (!forbidden_indexes.includes(j)) {
                            new_objective_function.push(modified_constraint[i][j]);
                        }
                    }
                }
                else{
                    new_objective_function.push(0);
                }
            }
        }
    }
    for(let i = 0; i < modified_constraint.length; i++){
        if(options[i] == ">=" || options[i] == "="){
            Bi+= modified_constraint[i][modified_constraint[i].length - 1] * (opt_type = "max" ? M : M * -1);
        }
    }
    initial_tableau.push([...new_objective_function.slice(0, non_basic_variables.length)]);
    initial_tableau[0].push(Bi);
    non_basic_variables.push("Bi");
    for(let i = 0; i < initial_tableau_constraints.length;i++){
        initial_tableau.push([...initial_tableau_constraints[i]]);
    }
    return [non_basic_variables,basic_variables,initial_tableau];
}

function calculatePivot(tableau, non_basic_indices, opt_type) {
    var pivot_col;
    if (opt_type === "min") {
        pivot_col = tableau[0].indexOf(Math.min.apply(Math, tableau[0].slice(0, -1)));
    } else {
        pivot_col = tableau[0].indexOf(Math.max.apply(Math, tableau[0].slice(0, -1)));
    }
    var positive_ratios_indices = [];
    for (var i = 1; i < tableau.length; i++) {
        if (tableau[i][pivot_col] > 0) {
            var ratio = tableau[i][tableau[0].length - 1] / tableau[i][pivot_col];
            if (!isNaN(ratio) && isFinite(ratio)) {
                positive_ratios_indices.push(i);
            }
        }
    }
    if (positive_ratios_indices.length === 0) {
        throw new Error("The problem is unbounded.");
    }
    var pivot_row = positive_ratios_indices.reduce(function (acc, current) {
        var accRatio = tableau[acc][tableau[0].length - 1] / tableau[acc][pivot_col];
        var curRatio = tableau[current][tableau[0].length - 1] / tableau[current][pivot_col];
        if (isNaN(accRatio) || !isFinite(accRatio)) {
            return current;
        }
        return curRatio < accRatio ? current : acc;
    }, positive_ratios_indices[0]);
    return [pivot_row, pivot_col];
}
function iteratorNextTableau(tableau, pivot_row, pivot_col) {
    tableau[pivot_row] = tableau[pivot_row].map(function (x) {
        return x / tableau[pivot_row][pivot_col];
    });
    for (var i = 0; i < tableau.length; i++) {
        if (i !== pivot_row) {
            tableau[i] = tableau[i].map(function (x, j) {
                return x - tableau[i][pivot_col] * tableau[pivot_row][j];
            });
        }
    }
    return tableau;
}

function matrixIterator(num_vars, num_cons, opt_type, obj_func, cons) {
    let Ce = [...obj_func];
    let Cb = Array(num_cons).fill(0);
    let E = cons.map(row => row.slice(0, -1));
    let B = mathUtilEye(num_cons);
    let bi = cons.map(row => row[row.length - 1]);
    let outputContainer = document.getElementById("output-container");
    matrixUtilOutput(outputContainer, "Ce = ", matrixUtilFormatter(Ce));
    matrixUtilOutput(outputContainer, "Cb = ", matrixUtilFormatter(Cb));
    matrixUtilOutput(outputContainer, "B = ", matrixUtilFormatter(B));
    matrixUtilOutput(outputContainer, "E = ", matrixUtilFormatter(E));
    let iteration = 1;
    globalUtilOutput(outputContainer, "<h1 style='color: #3498db;' - Iteratios - </h1>");
    let optimized = false;
    while (!optimized) {
        while (!optimized) {
            globalUtilOutput(outputContainer, `<h1 style='color: #3498db;'> Iteration - ${iteration} </h1>`);
            let new_Ce = math.subtract(Ce, math.multiply(Cb, math.multiply(math.inv(B), E)));
            matrixUtilOutput(outputContainer, `CE'`, matrixUtilFormatter(new_Ce));
            if (new_Ce.every((element) => element <= 0)) {
                optimized = true;
                break;
            }
            let pivot_col = new_Ce.indexOf(opt_type = "max" ? Math.max(...new_Ce.filter(value => value >= 0)) : Math.min(...new_Ce.filter(value => value <= 0)));
            let bbar = math.multiply(math.inv(B), bi);
            let pi = math.multiply(math.inv(B), math.column(E, pivot_col));
            let pivot_row = bbar
                .map((value, index) => (pi[index] > 0 ? value / pi[index] : Infinity))
                .reduce((minIndex, currentValue, currentIndex, array) => {
                    if (currentValue < array[minIndex] && currentValue > 0) {
                        return currentIndex;
                    } else {
                        return minIndex;
                    }
                }, 0);
            [Ce[pivot_col], Cb[pivot_row]] = refractorUtilSwap(Ce[pivot_col], Cb[pivot_row]);
            for (let i = 0; i < E.length; i++) {
                [E[i][pivot_col], B[i][pivot_row]] = refractorUtilSwap(E[i][pivot_col], B[i][pivot_row]);
            }
            matrixUtilOutput(outputContainer, `Ce = `, matrixUtilFormatter(Ce));
            matrixUtilOutput(outputContainer, `Cb = `, matrixUtilFormatter(Cb));
            matrixUtilOutput(outputContainer, `B = `, matrixUtilFormatter(B));
            matrixUtilOutput(outputContainer, `E = `, matrixUtilFormatter(E));
            iteration++;
            if (new_Ce.every((element) => opt_type = "max" ? element <= 0 : element >= 0)) {
                optimized = true;
                break;
            }
        matrixUtilOutput(outputContainer, `Ce = `, matrixUtilFormatter(Ce));
    }
    let solution = math.multiply(math.inv(B), bi);
    let objectiveValue = math.multiply(Cb, solution);
    return [solution,objectiveValue]
}
}

async function initializeSimplex() {
    const [num_vars, num_cons, opt_type, obj_func, cons, options, method] = getInput();
    const outputContainer = document.getElementById("output-container");

    if (method == "matrix") {
        const [solution, objectiveVal] = matrixIterator(num_vars, num_cons, opt_type, obj_func, cons);
        matrixUtilOutput(outputContainer, "X* = ", matrixUtilFormatter(solution));
        globalUtilOutput(outputContainer, `<h2>Z* = ${objectiveVal}<h2>`);
    } else {
        const variable_names = Array.from({ length: num_vars }, (_, i) => `X${i + 1}`);
        let non_basic_variables, basic_variables, initial_tableau;

        if (isBigM(options)) {
            [non_basic_variables, basic_variables, initial_tableau] = initializeBigMTableau(num_vars, num_cons, opt_type, obj_func, cons, options);
        } else {
            const slack_names = Array.from({ length: num_cons }, (_, i) => `E${i + 1}`);
            initial_tableau = initializeSimplexTableau(num_vars, num_cons, opt_type, obj_func, cons);
            non_basic_variables = variable_names.concat(slack_names, "Pi");
            basic_variables = slack_names.slice();
        }

        const non_basic_indices = Array.from({ length: num_vars + num_cons }, (_, i) => i);

        globalUtilOutput(outputContainer, "<h1> Initial Tableau <h1>");
        outputUtilDrawTable(initial_tableau, basic_variables, non_basic_variables);

        let iteration = 0;

        while (true) {
            const [pivot_row, pivot_col] = calculatePivot(initial_tableau, non_basic_indices, opt_type);
            basic_variables[pivot_row - 1] = isBigM(options) ? non_basic_variables[non_basic_indices.indexOf(pivot_col)] : variable_names[pivot_col];

            globalUtilOutput(outputContainer, `<h1 style='color=#3498db'> Iteration - ${++iteration} <h1>`);
            initial_tableau = iteratorNextTableau([...initial_tableau], pivot_row, pivot_col);
            outputUtilDrawTable(initial_tableau, basic_variables, non_basic_variables);

            const isOptimal = (opt_type === "min" && initial_tableau[0].slice(0, -1).every(x => x >= 0)) ||
                             (opt_type === "max" && initial_tableau[0].slice(0, -1).every(x => x <= 0));

            if (isOptimal) {
                break;
            }
        }

        for (let i = 0; i < num_cons; i++) {
            globalUtilOutput(outputContainer, `<h2>X* = (${basic_variables[i]} = ${initial_tableau[i + 1][initial_tableau[0].length - 1]})</h2>`);
        }
        globalUtilOutput(outputContainer, `<h2>Z* = ${initial_tableau[0][initial_tableau[0].length - 1] * -1}</h2>`);
    }
}


/*
    *
    *   
    * Utils Class
    * 
    *   
*/
function matrixUtilFormatter(matrix) {
    var formattedMatrix = "\\[ \\begin{bmatrix}";
    for (var i = 0; i < matrix.length; i++) {
        if (Array.isArray(matrix[i])) {
            formattedMatrix += matrix[i].map(function (x) {
                return x.toFixed(2);
            }).join(" & ");
        } else {
            formattedMatrix += matrix[i].toFixed(2); // Handle the case where matrix[i] is not an array
        }
        formattedMatrix += " \\\\";
    }
    formattedMatrix += "\\end{bmatrix} \\]";
    return formattedMatrix;
}
function mathUtilEye(size) {
    let eye = Array.from(Array(size), (_, i) =>
        Array.from(Array(size), (_, j) => (i === j ? 1 : 0))
    );
    return eye;
}
function refractorUtilSwap(a, b) {
    return [b, a]
}
function globalUtilOutput(container, content) {
    var div = document.createElement("div");
    div.innerHTML = content;
    container.appendChild(div);
}
function outputUtilDrawTable(tableau, basic_variables, non_basic_variables) {
    var outputContainer = document.getElementById("output-container");
    var table = document.createElement("table");
    table.id = "output-table"; // Set the id attribute
    table.border = "1";
    var nonBasicVarRow = table.insertRow();
    for (var k = 0; k <= tableau[0].length; k++) {
        var nonBasicVarCell = nonBasicVarRow.insertCell();
        nonBasicVarCell.innerHTML = k === 0 ? "" : non_basic_variables[k - 1];
    }
    for (var i = 0; i < tableau.length; i++) {
        var row = table.insertRow();
        var basicVarCell = row.insertCell();
        basicVarCell.innerHTML = i === 0 ? "Z" : basic_variables[i - 1];

        for (var j = 0; j < tableau[i].length; j++) {
            var cell = row.insertCell();
            cell.innerHTML = tableau[i][j].toFixed(2);
        }
    }
    outputContainer.appendChild(table);
}

function matrixUtilOutput(container, title, formattedMatrix) {
    const matrixContainer = document.createElement("div");
    const titleAndMatrix = document.createElement("div");
    titleAndMatrix.style.display = "flex";
    titleAndMatrix.style.alignItems = "center";
    const titleElement = document.createElement("h3");
    titleElement.textContent = title;
    titleAndMatrix.appendChild(titleElement);
    const equalsSign = document.createElement("span");
    equalsSign.textContent = " = ";
    titleAndMatrix.appendChild(equalsSign);
    const matrixContent = document.createElement("div");
    matrixContent.innerHTML = formattedMatrix;
    titleAndMatrix.appendChild(matrixContent);
    matrixContainer.appendChild(titleAndMatrix);
    container.appendChild(matrixContainer);
    MathJax.typesetPromise();
}
function isBigM(options){
    for(var i = 0; i < options.length; i++){
        if(options[i] == ">=" || options[i] == "="){
            return true;
        }
    }
    return false;
}