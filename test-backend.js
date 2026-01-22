// Test rápido de conexión con el backend
// Ejecuta este código en la consola del navegador (F12 → Console)

const testBackend = async () => {
    const url = 'https://script.google.com/macros/s/AKfycbzx_Z99DgJXFZIbD-dZ_7WBtBWdEM7DXQX2DTTZhPwA6dDnhilHVqHNTkQNUh4p-RTAKA/exec?entity=consumos&action=getAll';

    console.log('🔍 Probando conexión con backend...');
    console.log('URL:', url);

    try {
        const response = await fetch(url);
        console.log('✅ Respuesta recibida:', response.status, response.statusText);

        const data = await response.json();
        console.log('📦 Datos:', data);

        if (data.success) {
            console.log('✅ Backend funcionando correctamente');
            console.log(`📊 Registros encontrados: ${data.data?.length || 0}`);
        } else {
            console.error('❌ Error en backend:', data.message);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
};

// Ejecutar el test
testBackend();
