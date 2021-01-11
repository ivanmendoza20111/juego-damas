let kBoardWidth = 8;
let kBoardHeight = 8;
let kPieceWidth = 50;
let kPieceHeight = 50;
let kPixelWidth = 1 + (kBoardWidth * kPieceWidth);
let kPixelHeight = 1 + (kBoardHeight * kPieceHeight);
let kFilasIniciales = 3;
let kNegras = "#000000";
let kBlancas = "#ffffff";

let turnoBlancas; // Para el control de turnos. 
let turnoNegras;

let sonTablas = false;
let acuerdoTablas = false;

let indiceABorrar = -1; // Para borrar una pieza. 
let legalMoves; // Para los movimientos legales. 

let gCanvasElement;
let gDrawingContext;
let gPattern;

let piezas = [];

let gNumPieces = 24; // Controla las piezas metidas en memoria. 
let gNumMoves = 0; // Cuenta los movimientos sin que se produzca un salto. 

let gSelectedPieceIndex;
let gSelectedPieceHasMoved;
let gMoveCount;
let gMoveCountElem;
let gGameInProgress;

function getCursorPosition(e) {
	/* returns Cell with .row and .column properties */
	let x;
	let y;
	if (e.pageX != undefined && e.pageY != undefined) {
		x = e.pageX;
		y = e.pageY;
	} else {
		x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
	x -= gCanvasElement.offsetLeft;
	y -= gCanvasElement.offsetTop;
	x = Math.min(x, kBoardWidth * kPieceWidth);
	y = Math.min(y, kBoardHeight * kPieceHeight);
	let cell = new Casilla(Math.floor(y / kPieceHeight), Math.floor(x / kPieceWidth));
	return cell;
}

/*function gGameInProgress(){
	return true;
}*/

function isTheGameOver() {
	legalMoves = getLegalMoves();
	if (legalMoves.length === 0) {
		return true;
	} else {
		return false;
	}
}

function endGame() {
	gGameInProgress = false;
	if (sonTablas) {
		alert("Game over. Juego empate");
	} else if (turnoBlancas) {
		alert("Game over. Ganan Negras");
	} else {
		alert("Game over. Ganan Blancas");
	}
	newGame();
}

function getLegalMoves() {
	let theLegalMoves = [];
	let z = 0;

	while (z < piezas.length) {
		if (((turnoBlancas) && (kBlancas == piezas[z].color)) || ((turnoNegras) && (kNegras == piezas[z].color))) {
			let nuevosMovimientos = getLegalMovesPieza(piezas[z]); // Se obtienen los movimientos legales de una sola pieza.
			// Ordenamos los saltos y los movimientos. 
			let t = 0;
			while (t < nuevosMovimientos.length) { // Se quitan los saltos y se ponen los primeros. 
				if (nuevosMovimientos[t] instanceof Jump) {
					let oneJump = nuevosMovimientos.splice(t, 1);
					theLegalMoves = oneJump.concat(theLegalMoves); // Los saltos se concatenan por delante. 
				} else {
					t++;
				}
			}

			theLegalMoves = theLegalMoves.concat(nuevosMovimientos); // Se concatenan con la lista de todos los movimientos para ese jugador pero por detr�s. 
		}
		z++;
	}
	return theLegalMoves;
}

function getLegalMovesPieza(unaPieza) {
	let i = -1;
	let fila = 0;
	let columna = 0;
	let someLegalMoves = [];
	let vacia = false;

	while (i < 2) {
		if (((unaPieza.row != 0) && (turnoBlancas)) || ((unaPieza.row != 7) && (turnoNegras))) { // Si estan al final del tablero, no hay movimientos posibles
			if (((unaPieza.column != 0) && (i == -1)) || ((unaPieza.column != 7) && (i == 1))) { // Si están en una esquina del tablero, solo hay que comprobar uno de los laterales
				if (turnoBlancas) { // Así controlamos la dirección de la pieza
					fila = unaPieza.row - 1;
					columna = unaPieza.column + i;
				} else {
					fila = unaPieza.row + 1;
					columna = unaPieza.column + i;
				}
				let j = 0;
				let existe = false;
				while ((j < piezas.length) && (existe == false)) { // Si hay una pieza en la casilla a la que nos queremos mover, no nos podemos mover, a menos que se pueda saltar
					if ((piezas[j].row == fila) && (piezas[j].column == columna)) {
						existe = true;
						if (piezas[j].color != unaPieza.color) { // Si son de distinto color, igual se puede saltar
							if ((i < 0) && (turnoBlancas) && (unaPieza.column >= 2) && (unaPieza.row >= 2)) { // Miramos si, siendo blancas, tienen sitio para saltar 
								fila = unaPieza.row - 2;
								columna = unaPieza.column - 2;
								vacia = casillaVacia(fila, columna); // Si tiene sitio y está vacía, hay sitio para hacer un salto
							} else if ((i > 0) && (turnoBlancas) && (unaPieza.column <= 5) && (unaPieza.row >= 2)) { // Miramos si, siendo blancas, tienen sitio para saltar 
								fila = unaPieza.row - 2;
								columna = unaPieza.column + 2;
								vacia = casillaVacia(fila, columna); // Si tiene sitio y está vacía, hay sitio para hacer un salto
							} else if ((i < 0) && (turnoNegras) && (unaPieza.column >= 2) && (unaPieza.row <= 5)) { // Lo mismo para negras
								fila = unaPieza.row + 2;
								columna = unaPieza.column - 2;
								vacia = casillaVacia(fila, columna);
							} else if ((i > 0) && (turnoNegras) && (unaPieza.column <= 5) && (unaPieza.row <= 5)) {
								fila = unaPieza.row + 2;
								columna = unaPieza.column + 2;
								vacia = casillaVacia(fila, columna);
							}
						}
					} else {
						j++;
					}
				}
				if ((existe == false)) { // Si la casilla continúa está libre, se puede mover.
					let aMove = new Move(unaPieza.row, unaPieza.column, fila, columna);
					someLegalMoves.push(aMove);
				} else if ((existe == true) && (vacia == true)) { //Si no está libre pero se puede hacer un salto, también.
					let aJump = new Jump(unaPieza.row, unaPieza.column, fila, columna);
					someLegalMoves.unshift(aJump); // Los saltos quedan los primeros. 
				}
			}
		}
		i = i + 2;
	}
	return someLegalMoves;
}

function casillaVacia(fila, columna) {
	let y = 0;
	let vacia = true;
	while ((y < piezas.length) && (vacia == true)) {
		if ((piezas[y].row == fila) && (piezas[y].column == columna)) {
			vacia = false;
		} else {
			y++;
		}
	}
	return vacia;
}

function drawBoard() {

	gDrawingContext.clearRect(0, 0, kPixelWidth, kPixelHeight);

	gDrawingContext.beginPath();

	/* vertical lines */
	for (let x = 0; x <= kPixelWidth; x += kPieceWidth) {
		gDrawingContext.moveTo(0.5 + x, 0);
		gDrawingContext.lineTo(0.5 + x, kPixelHeight);
	}

	/* horizontal lines */
	for (let y = 0; y <= kPixelHeight; y += kPieceHeight) {
		gDrawingContext.moveTo(0, 0.5 + y);
		gDrawingContext.lineTo(kPixelWidth, 0.5 + y);
	}

	/* draw it! */
	gDrawingContext.strokeStyle = "#ccc";
	gDrawingContext.stroke();

	for (let i = 0; i < piezas.length; i++) {
		if (piezas[i] instanceof Reina) {
			drawQueen(piezas[i], piezas[i].color, i == gSelectedPieceIndex);
		} else {
			drawPiece(piezas[i], piezas[i].color, i == gSelectedPieceIndex);
		}
	}

	gMoveCountElem.innerHTML = gMoveCount;

	if (gGameInProgress && isTheGameOver()) {
		endGame();
	}
}

function drawPiece(p, color, selected) {
	let column = p.column;
	let row = p.row;
	let x = (column * kPieceWidth) + (kPieceWidth / 2);
	let y = (row * kPieceHeight) + (kPieceHeight / 2);
	let radius = (kPieceWidth / 2) - (kPieceWidth / 10);
	gDrawingContext.beginPath();
	gDrawingContext.arc(x, y, radius, 0, Math.PI * 2, false);
	gDrawingContext.closePath();
	gDrawingContext.fillStyle = color;
	gDrawingContext.fill();
	gDrawingContext.strokeStyle = "#000";
	gDrawingContext.stroke();
	if (selected) {
		gDrawingContext.fillStyle = "#ff0000";
		gDrawingContext.fill();
	}
}

function drawQueen(p, color, selected) {
	let column = p.column;
	let row = p.row;
	let x = (column * kPieceWidth) + (kPieceWidth / 2);
	let y = (row * kPieceHeight) + (kPieceHeight / 2);
	let radius = (kPieceWidth / 2) - (kPieceWidth / 10);
	gDrawingContext.beginPath();
	gDrawingContext.arc(x, y, radius, 0, Math.PI * 2, false);
	gDrawingContext.closePath();
	gDrawingContext.fillStyle = color;
	gDrawingContext.fill();
	gDrawingContext.strokeStyle = "#000";
	gDrawingContext.stroke();
	if (selected) {
		gDrawingContext.fillStyle = "#ff0000";
		gDrawingContext.fill();
	}
	// Para la corona circular. 
	gDrawingContext.beginPath();
	gDrawingContext.arc(x, y, radius + 2.5, 0, Math.PI * 2, false);
	gDrawingContext.closePath();
	gDrawingContext.strokeStyle = "#000";
	gDrawingContext.stroke();
}

function guardarPosiciones() {

	// Primero tenemos que vaciar para poder guardar
	for (let i = 0; i < gNumPieces; i++) {
		localStorage.removeItem("pieza" + i + ".fila");
		localStorage.removeItem("pieza" + i + ".columna");
		localStorage.removeItem("pieza" + i + ".color");
	}

	localStorage.setItem("numMove", gMoveCount);

	// Cogemos la cantidad de piezas actual, que es la que vamos a guardar en memoria tras vaciar lo anterior. 
	// Actualizamos el valor en memoria.
	gNumPieces = piezas.length;
	localStorage.setItem("numPiezas", gNumPieces);
	if (turnoBlancas) {
		localStorage.setItem("esTurno", "blancas");
	} else {
		localStorage.setItem("esTurno", "negras");
	}
	for (let i = 0; i < piezas.length; i++) {
		localStorage.setItem("pieza" + i + ".fila", piezas[i].row);
		localStorage.setItem("pieza" + i + ".columna", piezas[i].column);
		localStorage.setItem("pieza" + i + ".color", piezas[i].color);
	}
}

function cargarPosiciones() {
	piezas = [];

	gNumPieces = parseInt(localStorage.getItem("numPiezas"));
	gMoveCount = parseInt(localStorage.getItem("numMove"));

	for (let i = 0; i < gNumPieces; i++) {
		let row = parseInt(localStorage.getItem("pieza" + i + ".fila"));
		let column = parseInt(localStorage.getItem("pieza" + i + ".columna"));
		let color = localStorage.getItem("pieza" + i + ".color");
		if ((!(color === "null")) && (piezas.length < 24)) { // No puede haber más de 24 piezas válidas. 
			piezas.push(new Casilla(row, column, color));
		}
	}

	if (parseInt(localStorage.getItem("esTurno")) == "blancas") {
		turnoBlancas = true;
		turnoNegras = false;
	} else {
		turnoBlancas = false;
		turnoNegras = true;
	}

	limpiarMovimientos();

	drawBoard();
}

function empiezanBlancas() {

	document.getElementById("moveNegras").innerHTML = "<h3>Negras</h3>";
	document.getElementById("moveBlancas").innerHTML = "<h3>Blancas</h3>";

	document.getElementById("esTurno").innerHTML = "Empiezan Blancas:";
}


function newGame() {

	empiezanBlancas();

	// Reiniciamos letiables. 
	gNumMoves = 0;
	gNumPieces = 24;
	sonTablas = false;
	acuerdoTablas = false;
	turnoBlancas = true;
	turnoNegras = false;


	piezas = []; // Vaciamos la lista de piezas, por si estamos pulsando el resetButton. 

	for (let i = 0; i < kFilasIniciales; i++) {
		for (let j = (i + 1) % 2; j < kBoardHeight; j = j + 2) {
			piezas.push(new Casilla(i, j, kNegras));
		}
	}

	for (let i = kBoardHeight - 1; i >= kBoardHeight - kFilasIniciales; i--) {
		for (let j = (i + 1) % 2; j < kBoardHeight; j = j + 2) {
			piezas.push(new Casilla(i, j, kBlancas));
		}
	}

	gNumPieces = piezas.length;
	gSelectedPieceIndex = -1;
	gSelectedPieceHasMoved = false;
	gMoveCount = 0;
	gGameInProgress = false;

	turnoBlancas = true;
	turnoNegras = false;

	drawBoard();
	gGameInProgress = true;
}

function Casilla(row, column, color) {
	this.row = row;
	this.column = column;
	this.color = color;
}

function Reina(row, column, color) {
	Casilla.apply(this, [row, column, color]);
}

Reina.prototype = new Reina();
Reina.prototype.constructor = Reina;

function coronar(peon) {
	piezas.push(new Reina(peon.row, peon.column, peon.color));
}

function comprobarCoronacion() {
	if (((turnoBlancas) && (piezas[gSelectedPieceIndex].color == kBlancas) && (piezas[gSelectedPieceIndex].row == 0)) ||
		((turnoNegras) && (piezas[gSelectedPieceIndex].color == kNegras) && (piezas[gSelectedPieceIndex].row == 7))) {
		let candidata = piezas.splice(gSelectedPieceIndex, 1);
		coronar(candidata[0]);
	}
}

function Move(r1, c1, r2, c2) {
	this.fromRow = r1;
	this.fromCol = c1;
	this.toRow = r2;
	this.toCol = c2;
}

function Jump(r1, c1, r2, c2) {
	Move.apply(this, [r1, c1, r2, c2])
}

Jump.prototype = new Move();
Jump.prototype.constructor = Move;

function isThereAPieceBetween(casilla1, casilla2) {
	let existe = false;
	let i = 0;
	let fila = 0;
	let columna = 0;

	if ((turnoBlancas) && (casilla2.column - casilla1.column == -2) && (casilla2.row - casilla1.row == -2)) { // Hacia arriba a la izquierda
		columna = casilla1.column - 1;
		fila = casilla1.row - 1;
	} else if ((turnoBlancas) && (casilla2.column - casilla1.column == 2) && (casilla2.row - casilla1.row == -2)) { // Hacia arriba a la derecha
		columna = casilla1.column + 1;
		fila = casilla1.row - 1;
	} else if ((turnoNegras) && (casilla2.column - casilla1.column == -2) && (casilla2.row - casilla1.row == 2)) { // Hacia abajo a la izquierda
		columna = casilla1.column - 1;
		fila = casilla1.row + 1;
	} else if ((turnoNegras) && (casilla2.column - casilla1.column == 2) && (casilla2.row - casilla1.row == 2)) { // Hacia abajo a la derecha
		columna = casilla1.column + 1;
		fila = casilla1.row + 1;
	}
	while ((i < piezas.length) && (existe == false)) {
		if ((piezas[i].row == fila) && (piezas[i].column == columna)) {
			if (casilla1.color !== piezas[i].color) { // No puedes comer fichas de tu mismo color
				existe = true;
				indiceABorrar = i;
			} else {
				alert("No puedes comer fichas de tu mismo color");
			}
		}
		i++;
	}
	return existe;
}

function mostrarMovimiento(casilla1, casilla2, salto) {
	let movimiento = document.createElement("p");
	if (salto) {
		movimiento.innerHTML = "Salto: ( " + casilla1.row + " , " + casilla1.column + " ) --> ( " + casilla2.row + " , " + casilla2.column + " )";
	} else {
		movimiento.innerHTML = "( " + casilla1.row + " , " + casilla1.column + " ) --> ( " + casilla2.row + " , " + casilla2.column + " )";
	}
	if (turnoBlancas) {
		document.getElementById("moveBlancas").appendChild(movimiento);
		document.getElementById("esTurno").innerHTML = "Negras mueven:";
	} else {
		document.getElementById("moveNegras").appendChild(movimiento);
		document.getElementById("esTurno").innerHTML = "Blancas mueven:";
	}
}

function limpiarMovimientos() {
	document.getElementById("moveNegras").innerHTML = "<h3>Negras</h3>";
	document.getElementById("moveBlancas").innerHTML = "<h3>Blancas</h3>";
	if (turnoBlancas) {
		document.getElementById("esTurno").innerHTML = "Blancas mueven:";
	} else {
		document.getElementById("esTurno").innerHTML = "Negras mueven:";
	}
}

function clickOnEmptyCell(cell) {
	if (gSelectedPieceIndex == -1) {
		return;
	}

	let direccion = 1;
	if (piezas[gSelectedPieceIndex].color == kBlancas)
		direccion = -1;

	let rowDiff = direccion * (cell.row - piezas[gSelectedPieceIndex].row);
	let columnDiff = direccion * (cell.column - piezas[gSelectedPieceIndex].column);
	if ((rowDiff == 1 && Math.abs(columnDiff) == 1) && (!(legalMoves[0] instanceof Jump))) {
		/* we already know that this click was on an empty square,
		so that must mean this was a valid single-square move */

		// Mostramos el movimiento hecho
		mostrarMovimiento(piezas[gSelectedPieceIndex], cell, false);

		piezas[gSelectedPieceIndex].row = cell.row;
		piezas[gSelectedPieceIndex].column = cell.column;

		comprobarCoronacion();

		cambioTurno();
		gMoveCount += 1;
		gSelectedPieceIndex = -1;
		gSelectedPieceHasMoved = false;
		drawBoard();
		gNumMoves += 1;
		comprobarTablas();
		return;
	} else if ((rowDiff == 1 && Math.abs(columnDiff) == 1) && (legalMoves[0] instanceof Jump)) {
		alert("Hay saltos disponibles");
	} else if ((Math.abs(rowDiff) == 2 && Math.abs(columnDiff) == 2) &&
		isThereAPieceBetween(piezas[gSelectedPieceIndex], cell) && (legalMoves[0] instanceof Jump)) {
		/* this was a valid jump */
		if (!gSelectedPieceHasMoved) {
			gMoveCount += 1;
		}

		// Mostramos el movimiento hecho
		mostrarMovimiento(piezas[gSelectedPieceIndex], cell, true);

		piezas[gSelectedPieceIndex].row = cell.row;
		piezas[gSelectedPieceIndex].column = cell.column;

		if (indiceABorrar > gSelectedPieceIndex) { // Para evitar colisiones y fallos en los índices de las piezas. 
			borrarPieza();
			comprobarCoronacion();
		} else {
			comprobarCoronacion();
			borrarPieza();
		}

		// De momento, esto es así hasta que se puedan hacer saltos en cadena. 
		gSelectedPieceIndex = -1;
		gSelectedPieceHasMoved = false;


		// Actualizamos el contador de los movimientos de tablas, borramos y damos turno al otro jugador. 
		gNumMoves = 0;
		cambioTurno();
		drawBoard();
		return;
	}
	gSelectedPieceIndex = -1;
	gSelectedPieceHasMoved = false;
	drawBoard();
}

function comprobarTablas() {
	if ((gNumMoves >= 50) || (acuerdoTablas)) {
		sonTablas = true;
		endGame();
	}
}

function cambioTurno() {
	if (turnoBlancas) {
		turnoBlancas = false;
		turnoNegras = true;
	} else {
		turnoBlancas = true;
		turnoNegras = false;
	}
}

function borrarPieza() {
	piezas.splice(indiceABorrar, 1);
	indiceABorrar = -1;
	gNumPieces--;
}

function gestorClick(e) {
	let casilla = getCursorPosition(e);
	for (let i = 0; i < gNumPieces; i++) {
		if ((piezas[i].row == casilla.row) &&
			(piezas[i].column == casilla.column)) {
			clickOnPiece(i);
			return;
		}
	}
	clickOnEmptyCell(casilla);
}

function clickOnPiece(indicePieza) {
	if (((turnoBlancas) && (piezas[indicePieza].color == kBlancas)) || ((turnoNegras) && (piezas[indicePieza].color == kNegras))) {
		if (gSelectedPieceIndex == indicePieza) {
			return;
		}
		gSelectedPieceIndex = indicePieza;
		gSelectedPieceHasMoved = false;
		drawBoard();
	} else {
		alert("No es tu turno");
	}
}

function peticionTablas() {
	//cambioTurno(); 
	let respuesta = confirm("El otro jugador ha solicitado empate. Puedes aceptar para terminar la partida o cancelar para continuar.");
	if (respuesta) {
		acuerdoTablas = true;
		comprobarTablas();
	}
	//cambioTurno(); 
}

function iniciarJuego(canvasElement, moveCountElement) {
	gCanvasElement = canvasElement;
	gCanvasElement.width = kPixelWidth;
	gCanvasElement.height = kPixelHeight;
	gCanvasElement.addEventListener("click", gestorClick, false);
	gMoveCountElem = moveCountElement;
	gDrawingContext = gCanvasElement.getContext("2d");

	// Cargar piezas
	loadButton = document.getElementById("loadButton");
	loadButton.onclick = cargarPosiciones;

	// Guardar piezas 
	saveButton = document.getElementById("saveButton");
	saveButton.onclick = guardarPosiciones;

	// Nueva partida
	saveButton = document.getElementById("resetButton");
	saveButton.onclick = newGame;

	// Peticion tablas
	empateButton = document.getElementById("empateButton");
	empateButton.onclick = peticionTablas;

	newGame();
}