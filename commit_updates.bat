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
git commit -m "Fix: Auditoria v8.7 (Absoluta) y Alertas v1.1 (Forense) + UI Responsiva"
echo.
echo ==========================================
echo  COMMIT REALIZADO CORRECTAMENTE
echo  Para subir los cambios a la nube, ejecuta:
echo  git push
echo ==========================================
pause
