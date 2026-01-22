/**
 * USUARIOS CRUD (Admin Only)
 */

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
    case 'delete': return deleteUsuario(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

/**
 * Get all users (Masking passwords)
 */
function getAllUsuarios() {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const usuarios = rows.map((row, index) => {
    return {
      id: row[COLUMNS.USUARIOS.EMAIL], // Use Email as ID
      email: row[COLUMNS.USUARIOS.EMAIL],
      password: "", // Security: Do not expose password
      role: row[COLUMNS.USUARIOS.ROL],
      name: row[COLUMNS.USUARIOS.NOMBRE]
    };
  });

  return createResponse(true, usuarios);
}

/**
 * Create a new user
 */
function createUsuario(data) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const rows = sheet.getDataRange().getValues();
  
  // Check duplicates
  for(let i=1; i<rows.length; i++) {
    if(rows[i][COLUMNS.USUARIOS.EMAIL] === data.email) {
      return createErrorResponse("El usuario ya existe.");
    }
  }

  const newRow = [];
  newRow[COLUMNS.USUARIOS.EMAIL] = data.email;
  newRow[COLUMNS.USUARIOS.PASSWORD] = data.password; // Plain text as per current simplified auth
  newRow[COLUMNS.USUARIOS.ROL] = data.role;
  newRow[COLUMNS.USUARIOS.NOMBRE] = data.name;

  sheet.appendRow(newRow);
  return createResponse(true, { id: data.email, ...data }, "Usuario creado exitosamente.");
}

/**
 * Update user (ID is the old email)
 */
function updateUsuario(currentEmail, data) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][COLUMNS.USUARIOS.EMAIL]) === String(currentEmail)) {
      // Update fields
      if (data.email) sheet.getRange(i + 1, COLUMNS.USUARIOS.EMAIL + 1).setValue(data.email);
      if (data.password && data.password !== "") sheet.getRange(i + 1, COLUMNS.USUARIOS.PASSWORD + 1).setValue(data.password);
      if (data.role) sheet.getRange(i + 1, COLUMNS.USUARIOS.ROL + 1).setValue(data.role);
      if (data.name) sheet.getRange(i + 1, COLUMNS.USUARIOS.NOMBRE + 1).setValue(data.name);
      
      return createResponse(true, null, "Usuario actualizado.");
    }
  }
  return createErrorResponse("Usuario no encontrado.");
}

/**
 * Delete user
 */
function deleteUsuario(email) {
  const sheet = getSheet(SHEET_NAMES.USUARIOS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][COLUMNS.USUARIOS.EMAIL]) === String(email)) {
      sheet.deleteRow(i + 1);
      return createResponse(true, null, "Usuario eliminado.");
    }
  }
  return createErrorResponse("Usuario no encontrado.");
}
