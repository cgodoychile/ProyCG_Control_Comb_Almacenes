@echo off
echo ==========================================
echo  PREPARANDO SUBIDA A GITHUB (v8.7 Correctiva)
echo ==========================================
git status
echo.
echo Agregando archivos...
git add .
echo.
echo Realizando commit...
git commit -m "Fix: Consumos - Ordenamiento por Fecha/Contador y Auto-ID Backend"
echo.
echo ==========================================
echo  COMMIT REALIZADO CORRECTAMENTE
echo  Para subir los cambios a la nube, ejecuta:
echo  git push
echo ==========================================
pause
