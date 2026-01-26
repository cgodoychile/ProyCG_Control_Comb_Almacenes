function handleUsuariosGet(action) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllUsuarios();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleUsuariosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createUsuario(data);
    case 'update': return updateUsuario(id, data);
    case 'delete': return deleteUsuario(id, data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllUsuarios() {
  try {
    const sheet = getSheet(SHEET_NAMES.USUARIOS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    const usuarios = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[COLUMNS.USUARIOS.EMAIL]) continue;

        usuarios.push({
            id: row[COLUMNS.USUARIOS.EMAIL], // Usar email como ID unico
            email: row[COLUMNS.USUARIOS.EMAIL],
            nombre: row[COLUMNS.USUARIOS.NOMBRE],
            rol: row[COLUMNS.USUARIOS.ROL],
            password: row[COLUMNS.USUARIOS.PASSWORD]
        });
    }
    return createResponse(true, usuarios);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createUsuario(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.USUARIOS);
    const newRow = Array(4).fill('');
    newRow[COLUMNS.USUARIOS.EMAIL] = data.email;
    newRow[COLUMNS.USUARIOS.PASSWORD] = data.password;
    newRow[COLUMNS.USUARIOS.ROL] = data.rol || 'user';
    newRow[COLUMNS.USUARIOS.NOMBRE] = data.nombre;
    
    sheet.appendRow(newRow);
    return createResponse(true, data, "Usuario creado exitosamente");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateUsuario(email, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.USUARIOS);
    const dataRange = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < dataRange.length; i++) {
        if (dataRange[i][COLUMNS.USUARIOS.EMAIL] === email) {
            rowIndex = i + 1;
            break;
        }
    }
    
    if (rowIndex > 1) {
      if (data.password) sheet.getRange(rowIndex, COLUMNS.USUARIOS.PASSWORD + 1).setValue(data.password);
      if (data.rol) sheet.getRange(rowIndex, COLUMNS.USUARIOS.ROL + 1).setValue(data.rol);
      if (data.nombre) sheet.getRange(rowIndex, COLUMNS.USUARIOS.NOMBRE + 1).setValue(data.nombre);
      
      return createResponse(true, null, "Usuario actualizado exitosamente");
    }
    return createResponse(false, null, "Usuario no encontrado");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deleteUsuario(email, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.USUARIOS);
    const dataValues = sheet.getDataRange().getValues();
    
    for (let i = 1; i < dataValues.length; i++) {
        if (dataValues[i][COLUMNS.USUARIOS.EMAIL] === email) {
            sheet.deleteRow(i + 1);
            // Audit Log
            registrarAccion('Usuarios', 'eliminar', `Usuario ${email} eliminado`, 'warning', null, data ? data.justificacion : null);
            return createResponse(true, { message: 'Usuario eliminado' });
        }
    }
    throw new Error('Usuario no encontrado');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}
