/**
 * AUTHENTICATION MODULE
 */

function handleAuthPost(action, id, data) {
    switch (action.toLowerCase()) {
        case 'login': return login(data.email, data.password);
        default: return createResponse(false, null, "Action not found");
    }
}

function login(email, password) {
    try {
        const sheet = getSheet(SHEET_NAMES.USUARIOS);
        var data = sheet.getDataRange().getValues();
        
        // Setup Check: If empty, populate and RE-READ
        if (data.length <= 1) {
             setupUsers(sheet);
             data = sheet.getDataRange().getValues(); // Re-fetch data immediately
        }
        
        const inputEmail = String(email || "").trim().toLowerCase();
        const inputPass = String(password || "").trim();

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const storedEmail = String(row[COLUMNS.USUARIOS.EMAIL] || "").trim().toLowerCase();
            const storedPass = String(row[COLUMNS.USUARIOS.PASSWORD] || "").trim();
            
            if (storedEmail === inputEmail) {
                if (storedPass === inputPass) {
                    return createResponse(true, {
                        email: row[COLUMNS.USUARIOS.EMAIL],
                        name: row[COLUMNS.USUARIOS.NOMBRE],
                        role: row[COLUMNS.USUARIOS.ROL],
                        token: "mock-jwt-" + new Date().getTime()
                    });
                } else {
                    return createResponse(false, null, "Contraseña incorrecta");
                }
            }
        }
        
        return createResponse(false, null, "Usuario no encontrado: " + inputEmail);
        
    } catch (error) {
         return createResponse(false, null, "Error en Login: " + error.toString());
    }
}

function setupUsers(sheet) {
    if (!sheet) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        sheet = ss.getSheetByName(SHEET_NAMES.USUARIOS);
    }
    
    // Clear and reset
    sheet.clear();
    
    // Headers matching COLUMNS.USUARIOS order (Email:0, Password:1, ROL:2, NOMBRE:3)
    const headers = ["Email", "Password", "Rol", "Nombre"];
    
    const users = [
        ["admin", "g0d0y", "admin", "Administrador"],
        ["usuario", "123456", "user", "Usuario Operador"],
        ["visor", "123456", "viewer", "Usuario Visor"]
    ];
    
    sheet.appendRow(headers);
    users.forEach(u => sheet.appendRow(u));
    
    SpreadsheetApp.flush(); // FORCE SAVE
}
