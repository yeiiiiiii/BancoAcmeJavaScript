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

// Lógica para manejar el formulario de inicio de sesión
document.getElementById('iniciarSesionBtn').addEventListener('click', async function() {
    let documento = document.getElementById('documentoSesion').value;
    let clave = document.getElementById('claveSesion').value;

    // Validar que todos los campos estén completos
    if (!documento || !clave) {
        alert("✧ Todos los campos son obligatorios ✧");
        return;
    }
    // Esperar a que la base de datos se abra antes de verificar el usuario
    await abrirDatos();

    // Verificar si el usuario existe y la clave es correcta
    let transaction = db.transaction(["usuarios"], "readonly");
    let usuariosStore = transaction.objectStore("usuarios");
    let request = usuariosStore.get(documento);

    request.onsuccess = function(event) {
        const usuario = event.target.result;
        if (!usuario || usuario.clave !== clave) {
            alert("✧ Documento o clave incorrectos ✧");
            console.log("Documento o clave incorrectos");
            return;
        }
        // Usuario autenticado correctamente
        console.log("Usuario autenticado:", usuario);
        window.location.href = "../pages/menu.html";
    };

    request.onerror = function(event) {
        alert("✧ Error al obtener el usuario ✧");
        console.log("Error al obtener el usuario");
    };
});
