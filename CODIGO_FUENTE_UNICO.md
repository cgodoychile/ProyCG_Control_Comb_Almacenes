# GUÍA DE FUENTE ÚNICA (CLEAN START)

Para asegurar que el sistema funcione sin errores, hemos regenerado TODOS los códigos del backend.
Por favor, en tu proyecto de Google Apps Script, **elimina o reemplaza** los archivos existentes con el contenido de los archivos en la carpeta `docs/`.

Aquí tienes la lista de los 6 archivos que conforman tu sistema:

## 1. Config.gs
**Ubicación:** `docs/Config.gs`
**Función:** Configuración global y funciones helper. Define `VEHICULOS` con `PATENTE` (columna 0).

## 2. Main.gs
**Ubicación:** `docs/Main.gs`
**Función:** Puntos de entrada `doGet` y `doPost` con enrutamiento a todas las entidades (Consumos, Vehiculos, Estanques, Cargas, Activos).

## 3. VehiculosCRUD.gs
**Ubicación:** `docs/VehiculosCRUD.gs`
**Función:** Gestión de vehículos usando Patente.

## 4. ConsumosCRUD.gs
**Ubicación:** `docs/ConsumosCRUD.gs`
**Función:** Gestión de consumos y actualización automática de stock.

## 5. EstanquesCRUD.gs
**Ubicación:** `docs/EstanquesCRUD.gs`
**Función:** Gestión de estanques y control de stock.

## 6. ActivosCRUD.gs
**Ubicación:** `docs/ActivosCRUD.gs`
**Función:** Inventario de otros activos.

## 7. CargasEstanquesCRUD.gs
**Ubicación:** `docs/CargasEstanquesCRUD.gs`
**Función:** Registro de recargas de combustible.

---

### INSTRUCCIONES DE DESPLIEGUE FINAL

1.  Abre tu proyecto en Apps Script.
2.  Asegúrate de tener **exactamente** estos archivos (puedes borrar los antiguos o renombrarlos).
3.  Copia el contenido de cada archivo desde la carpeta `docs/` de tu proyecto local.
4.  **Guarda** todo.
5.  **Implantar > Nueva implantación**.
    *   Tipo: Aplicación web.
    *   Ejecutar como: **Yo**.
    *   Acceso: **Cualquier usuario**.
6.  **Copia la Nueva URL** y provéemela para actualizar el frontend y probar.
