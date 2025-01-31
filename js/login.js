let db;
// Abrir la base de datos de IndexedDB
function abrirDatos() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("IndexBD", 1);
        request.onerror = function(event) {
            console.log("Error al abrir la base de datos", event);
            reject("Error al abrir la base de datos");
        };
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log("Base de datos abierta con éxito");
            resolve();
        };
        request.onupgradeneeded = function(event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains("usuarios")) {
                db.createObjectStore("usuarios", { keyPath: "documento" });
            }
        };
    });
}
// Función para crear un nuevo usuario
function crearUsuario(documento, nombre, clave, numeroCuenta, saldoInicial) {
    let transaction = db.transaction(["usuarios"], "readwrite");
    let usuariosStore = transaction.objectStore("usuarios");

    // Verificamos si el usuario ya existe
    let request = usuariosStore.get(documento);
    request.onsuccess = function(event) {
        if (event.target.result) {
            alert("✧----- Usuario ya registrado -----✧");
            return false;
        }
        // Crear un nuevo usuario
        let nuevoUsuario = {
            documento: documento,
            nombre: nombre,
            clave: clave,
            numeroCuenta: numeroCuenta,
            saldo: saldoInicial,
            movimientos: []
        };
        let addRequest = usuariosStore.add(nuevoUsuario);
        addRequest.onsuccess = function() {
            console.log("Usuario creado y guardado:", nuevoUsuario);
            alert(`--Su cuenta fue creada con éxito--\n--Número de cuenta: ${numeroCuenta}--\n--Saldo actual: ${saldoInicial} --`);
            setTimeout(function() {
                window.location.href = "../index.html"; 
            }, 2000);
        };
    };
}

// Verificar si el número de documento es válido
function esNumeroPositivo(valor) {
    return !isNaN(valor) && valor > 0;
}

// Lógica para manejar el formulario de creación de cuenta
document.getElementById('crearCuentaBtn').addEventListener('click', async function() {
    let documento = document.getElementById('documento').value;
    let nombre = document.getElementById('nombre').value;
    let clave = document.getElementById('clave').value;
    let confirmarClave = document.getElementById('confirmarClave').value;

    // Validar que todos los campos estén completos
    if (!documento || !nombre || !clave || !confirmarClave) {
        alert("✧ Todos los campos son obligatorios ✧");
        return;
    }
    // Verificar que las claves coincidan
    if (clave !== confirmarClave) {
        alert("✧ Las claves no coinciden. Por favor, intente de nuevo ✧");
        return;
    }
    // Validar que el documento sea positivo
    if (!esNumeroPositivo(documento)) {
        alert("✧ El número de documento no es válido ✧");
        return;
    }
    await abrirDatos();
    // Generar un número de cuenta aleatorio
    let numeroCuenta = (Math.random() * 1000000).toFixed(0);
    let saldoInicial = 0;
    // Crear usuario
    crearUsuario(documento, nombre, clave, numeroCuenta, saldoInicial);
});

// Lógica para manejar el formulario de inicio de sesión
document.getElementById('iniciarSesionBtn').addEventListener('click', async function() {
    let documento = document.getElementById('documentoSesion').value;
    let clave = document.getElementById('claveSesion').value;
    // Validar que todos los campos estén completos
    if (!documento || !clave) {
        alert("✧✧ Todos los campos son obligatorios ✧✧");
        return;
    }
    // Esperar a que la base de datos se abra antes de verificar el usuario
    await abrirDatos();
    // Verificar si el usuario existe y la clave es correcta
    let transaction = db.transaction(["usuarios"], "readonly");
    let usuariosStore = transaction.objectStore("usuarios");
    let request = usuariosStore.get(documento);
});
