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
// Función para consignar dinero
async function consignarDinero() {
    try {
        await abrirDatos(); 
        const opc = prompt('Escoja una opción a realizar:\n1. Consignar a mi cuenta\n2. Consignar a otra cuenta');
        if (opc === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        if (opc === '1') {
            let documento = prompt('--> Escriba su número de documento:');
            if (documento === null) return;
            const usuario = await Usuario_Documento(documento);
            if (!usuario) {
                alert("*--- Usuario no encontrado ---*");
                return;
            }
            let monto = prompt('--> Ingrese el monto a consignar:');
            if (monto === null) {
                alert("*--- Operación cancelada ---*");
                return;
            }
            while (!esNumeroPositivo(monto)) {
                alert("✧ Por favor, ingrese un monto válido ✧");
                monto = prompt('--> Ingrese el monto a consignar:');
                if (monto === null) {
                    alert("*--- Operación cancelada ---*");
                    return;
                }
            }
            monto = parseFloat(monto);
            await actualizarSaldo(usuario.documento, monto);
            await registrarMovimiento(usuario.documento, "Consignación", monto, usuario.saldo + monto);
            alert(`✧ Se consignaron ${monto} a su cuenta ✧\n✧ Saldo actual: ${usuario.saldo + monto} ✧`);
        } else if (opc === '2') {
            let monto = prompt('--> Ingrese el monto a consignar:');
            if (monto === null) {
                alert("*--- Operación cancelada ---*");
                return;
            }
            while (!esNumeroPositivo(monto)) {
                alert("✧✧ Por favor, ingrese un monto válido ✧✧");
                monto = prompt('--> Ingrese el monto a consignar:');
                if (monto === null) {
                    alert("*--- Operación cancelada ---*");
                    return;
                }
            }
            monto = parseFloat(monto);
            let cuentaDestino = prompt('--> Ingrese el número de cuenta de destino:');
            if (cuentaDestino === null) {
                alert("*--- Operación cancelada ---*");
                return;
            }
            if (!esNumeroPositivo(cuentaDestino)) {
                alert("✧✧ Por favor, ingrese un número de cuenta válido ✧✧");
                return;
            }
            const cuentaDestinoUsuario = await Usuario_Documento(cuentaDestino);
            if (!cuentaDestinoUsuario) {
                alert("*--- Cuenta destino no encontrada ---*");
                return;
            }
            cuentaDestinoUsuario.saldo += monto;
            await registrarMovimiento(cuentaDestinoUsuario.documento, "Consignación", monto, cuentaDestinoUsuario.saldo, cuentaDestino);
            alert(`✧✧✧ Se consignaron ${monto} a la cuenta ${cuentaDestino} ✧✧✧\n✧✧✧ Saldo actual de la cuenta destino: ${cuentaDestinoUsuario.saldo} ✧✧✧`);
        } else {
            alert("*--- Opción no válida ---*");
        }
    } catch (error) {
        alert(`${error}`);
    }
}
// Función para obtener el usuario por documento
function Usuario_Documento(documento) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(["usuarios"], "readonly");
        let usuariosStore = transaction.objectStore("usuarios");
        let request = usuariosStore.get(documento);
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        request.onerror = function(event) {
            reject("Error al obtener el usuario");
        };
    });
}
// Función para actualizar el saldo de un usuario
function actualizarSaldo(documento, monto) {
    return Usuario_Documento(documento).then(usuario => {
        if (usuario) {
            usuario.saldo += monto;
            let transaction = db.transaction(["usuarios"], "readwrite");
            let usuariosStore = transaction.objectStore("usuarios");
            let request = usuariosStore.put(usuario);
            request.onsuccess = function() {
                return usuario.saldo;
            };
        }
        return null;
    });
}
// Función para registrar un movimiento
async function registrarMovimiento(documento, tipo, monto, saldoNuevo, cuentaDestino = null, referencia = null) {
    return Usuario_Documento(documento).then(usuario => {
        if (!usuario) {
            let output = document.getElementById('output');
            output.innerText = "*--- Usuario no encontrado ---*";
            return false;
        }
        let movimiento = {
            tipo: tipo,
            monto: monto,
            saldoNuevo: saldoNuevo,
            cuentaDestino: cuentaDestino,
            referencia: referencia
        };
        usuario.movimientos.push(movimiento);
        let transaction = db.transaction(["usuarios"], "readwrite");
        let usuariosStore = transaction.objectStore("usuarios");
        let request = usuariosStore.put(usuario);
        request.onsuccess = function() {
            console.log("Movimiento registrado:", movimiento);
            return true;
        };
        request.onerror = function(event) {
            return false;
        };
    });
}
function esNumeroPositivo(valor) {
    return !isNaN(valor) && valor > 0;
}
// Agregar el manejo de botones
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('consignarCuenta').addEventListener('click', consignarDinero);
});
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('retirarDinero').addEventListener('click', retirarDinero);
});
async function retirarDinero() {
    try {
        await abrirDatos();
        // Solicitar el documento del usuario
        let documento = prompt('--> Ingrese su documento para autorizar el retiro:');
        if (documento === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        // Obtener el usuario autenticado por documento
        const usuario = await Usuario_Documento(documento);
        // Verificar si hay un usuario autenticado
        if (!usuario) {
            alert("*--- Usuario no encontrado ---*");
            console.log("Usuario no encontrado");
            return;
        }
        // Solicitar el monto a retirar
        let monto = prompt('--> Ingrese el monto a retirar:');
        if (monto === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        // Validar que el monto sea un número positivo
        while (!esNumeroPositivo(monto)) {
            alert("✧✧ Por favor, ingrese un monto válido ✧✧");
            monto = prompt('--> Ingrese el monto a retirar:');
            if (monto === null) {
                alert("*--- Operación cancelada ---*");
                return;
            }
        }
        monto = parseFloat(monto);
        // Validar que el monto no supere el saldo del usuario
        if (usuario.saldo < monto) {
            alert("✧✧ No hay suficiente saldo para retirar el monto solicitado ✧✧");
            console.log("Saldo insuficiente");
            return;
        }
        // Actualizar el saldo del usuario
        await actualizarSaldo(usuario.documento, -monto);
        // Registrar el movimiento de retiro
        await registrarMovimiento(usuario.documento, "Retiro", monto, usuario.saldo - monto);
        alert(`✧✧ Se retiró ${monto} de su cuenta ✧✧\n✧✧ Saldo actual: ${usuario.saldo - monto} ✧✧`);
        console.log(`✧✧ Se retiró ${monto} de su cuenta ✧✧\n✧✧ Saldo actual: ${usuario.saldo - monto} ✧✧`);
    }
    catch (error) {
        alert(`${error}`);
        console.error(error);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pagoServicios').addEventListener('click', pagoServicios);
});
async function pagoServicios() {
    try {
        await abrirDatos();
        alert('Vamos a proceder con el pago de servicios.');
        let documento = prompt('--> Ingrese su documento para autorizar el pago de servicios:');
        if (documento === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        const usuario = await Usuario_Documento(documento);
        if (!usuario) {
            alert("*--- Usuario no encontrado ---*");
            console.log("Usuario no encontrado");
            return;
        }
        const servicio = prompt('Escoja el servicio a pagar:\n1. Agua\n2. Luz\n3. Gas');
        if (servicio === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        if (servicio !== '1' && servicio !== '2' && servicio !== '3') {
            alert("*--- Opción no válida ---*");
            return;
        }
        let monto = prompt('--> Ingrese el monto a pagar:');
        if (monto === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        while (!esNumeroPositivo(monto)) {
            alert("✧ Por favor, ingrese un monto válido ✧");
            monto = prompt('--> Ingrese el monto a pagar:');
            if (monto === null) {
                alert("*--- Operación cancelada ---*");
                return;
            }
        }
        monto = parseFloat(monto);
        let referencia = prompt('--> Ingrese una referencia para el pago de servicios:');
        if (referencia === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        if (usuario.saldo < monto) {
            alert("✧ Saldo insuficiente para pagar servicios ✧");
            console.log("Saldo insuficiente");
            return;
        }
        // Realizar el pago y registrar el movimiento
        await actualizarSaldo(usuario.documento, -monto);
        await registrarMovimiento(usuario.documento, "Pago de servicios", monto, usuario.saldo - monto, null, `Servicio: ${servicio === '1' ? 'Agua' : servicio === '2' ? 'Luz' : 'Gas'}, Referencia: ${referencia}`);
        // Actualizar el saldo del usuario
        usuario.saldo -= monto;
        alert(`✧ Se pagaron ${monto} para el servicio ${servicio === '1' ? 'Agua' : servicio === '2' ? 'Luz' : 'Gas'} ✧\n✧ Referencia: ${referencia} ✧`);
        console.log(`✧ Se pagaron ${monto} para el servicio ${servicio === '1' ? 'Agua' : servicio === '2' ? 'Luz' : 'Gas'} ✧\n✧ Saldo actual: ${usuario.saldo} ✧\n✧ Referencia: ${referencia} ✧`);
    } catch (error) {
        alert(`${error.message}`);
        console.error(error); 
    }
}
async function mostrarMovimientos() {
    try {
        await abrirDatos(); 
        const documentoMov = prompt("--> Escriba su número de documento para ver sus movimientos:");
        if (documentoMov === null) {
            alert("*--- Operación cancelada ---*");
            return;
        }
        const usuarioMov = await Usuario_Documento(documentoMov);
        if (!usuarioMov) {
            alert("*--- Usuario no encontrado ---*");
            return;
        }
        if (usuarioMov.movimientos.length === 0) {
            alert("✩✩✩✩✩ No hay movimientos registrados. ✩✩✩✩✩");
        } else {
            let movimientosStr = "✧ Movimientos ✧\n";
            usuarioMov.movimientos.forEach(movimiento => {
                movimientosStr += `✩ Tipo: ${movimiento.tipo}, Monto: ${movimiento.monto} --- Nuevo Saldo: ${movimiento.saldoNuevo} ✩\n`;
                if (movimiento.cuentaDestino) {
                    movimientosStr += `✩ Cuenta destino: ${movimiento.cuentaDestino} ✩\n`;
                } 
                // Si hay referencia, agregarla a la descripción
                if (movimiento.referencia) {
                    movimientosStr += `✩ Referencia: ${movimiento.referencia} ✩\n`;
                }
                movimientosStr += '\n';
            });
            alert(movimientosStr);
        }
    } catch (error) {
        alert(`${error.message}`);
        console.error(error);
    }
}
// Agregar el manejo de eventos para el botón "Movimientos"
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('movimientos').addEventListener('click', mostrarMovimientos);
});
document.getElementById('Salida').addEventListener('click', function() {
    // Redirigir a la página de creación de cuenta
    window.location.href = "../index.html";  
});
