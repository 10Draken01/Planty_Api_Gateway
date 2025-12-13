FROM mongo:6.0

# Variables de entorno
ENV MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME}
ENV MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
ENV MONGO_INITDB_DATABASE=${MONGO_INITDB_DATABASE}

# Crear script de inicialización
RUN mkdir -p /docker-entrypoint-initdb.d

# Script para crear usuario admin
RUN echo 'db.createUser({user: process.env.MONGO_INITDB_ROOT_USERNAME, pwd: process.env.MONGO_INITDB_ROOT_PASSWORD, roles: [{role: "root", db: "admin"}]});' > /docker-entrypoint-initdb.d/init.js

EXPOSE 27017

CMD ["mongod", "--bind_ip_all", "--auth"]