# MSWP

## Descripción

MSWP es una aplicación web que permite enviar mensajes masivos a WhatsApp utilizando datos de un archivo CSV. Facilita la automatización de comunicaciones personalizadas para clientes, promociones o notificaciones.

## Características

- Carga de archivos CSV o desde URL
- Plantillas de mensajes personalizables con marcadores de posición
- Integración de imágenes vía URL
- Mapeo de columnas del CSV
- Vista previa en vivo de los mensajes
- Historial de mensajes enviados
- Configuraciones guardadas automáticamente

## Tecnologías

- HTML5
- CSS3
- JavaScript (ES6+)
- PapaParse para parsing de CSV

## Uso

1. Abre index.html en un navegador.
2. Configura la URL base de imágenes y la plantilla del mensaje.
3. Sube o enlaza un archivo CSV con los datos de los contactos. Puedes probar con `csv/ejemplo.csv`, que trae datos inventados.
4. Mapea las columnas si es necesario.
5. Envía los mensajes.

## Formato del CSV

Separado por punto y coma, con estas columnas:

```
nombre;telefono;producto;precio;cod_cliente;ubicacion
```

> **Privacidad:** los CSV con datos reales de clientes se quedan en tu computadora. El `.gitignore` impide subirlos al repositorio; solo se versiona el archivo de ejemplo.

## Instalación

No requiere instalación. Solo abre los archivos en un navegador web moderno.

