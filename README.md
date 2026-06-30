# Sistema de Helpdesk con RabbitMQ

**Trabajo Práctico:** Comunicación por eventos con broker  
**Materia:** Integración de Aplicaciones - ITS Cipolletti

## 📖 Descripción del Proyecto
Este proyecto implementa una arquitectura orientada a eventos simulando el backend de un sistema de mesa de ayuda (Helpdesk). El objetivo principal es demostrar el desacoplamiento de servicios mediante el uso de un Message Broker, coordinando tareas entre distintos procesos que se comunican de forma asincrónica.

## Tecnologías Utilizadas
* **Entorno de ejecución:** Node.js
* **Framework Web:** Express.js (para el servicio HTTP)
* **Message Broker:** RabbitMQ
* **Cliente AMQP:** `amqplib`
* **Infraestructura:** Docker y Docker Compose

## Instalación y Configuración

1. **Clonar o descargar el repositorio**
2. **Abrir una terminal en la carpeta raíz del proyecto.**
3. **Instalar las dependencias de Node.js con: `npm install`**
4. **Levantar RabbitMQ: `docker compose up -d`**
5. **Abrir 4 termianles en total en la raiz del proyecto**
6. **En la terminal 1 ejecutar el comando: `npm run api` - Este iniciara la API**
7. **En la terminar 2 ejecutar el comando: `npm run worker:assign` - Este iniciara el Worker de Asignación**
8. **En la terminal 3 ejecutar el comando: `npm run worker:audit` - Este iniciara el Worker de Auditoria**
9. **En la terminal 4 ejecutar el comando: `curl.exe -X POST http://localhost:3000/tickets -H "Content-Type: application/json" -d "{\"title\": \"No puedo ingresar\", \"description\": \"Error 403\", \"priority\": \"high\"}"` - Este enviara una peticion HTTP simulabndo la creación de un ticket**

## Resultados
1. **En la Terminal 1 (API): Se confirmará la recepción HTTP y la publicación del evento con la routing key `ticket.created.high`.**

2. **En la Terminal 2 (Assignment Worker): Se observará en los logs que atrapó el evento `ticket.created` y, tras un segundo, generó y publicó el evento `ticket.assigned`.**

3. En la Terminal 3 (Audit Worker): Registrará por consola ambos eventos gracias al enrutamiento por comodín.

4. Archivo de Log: En la raíz del proyecto, se generará o actualizará el archivo `audit.log` con el historial exacto y los timestamps de los movimientos procesados.