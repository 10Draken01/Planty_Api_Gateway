FROM mongo:6.0

# Variables de entorno
ENV MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME}
ENV MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
ENV MONGO_INITDB_DATABASE=${MONGO_INITDB_DATABASE}

# Copiar script de inicialización
COPY init-mongo.sh /docker-entrypoint-initdb.d/

# Dar permisos de ejecución
RUN chmod +x /docker-entrypoint-initdb.d/init-mongo.sh

EXPOSE 27017

CMD ["mongod", "--bind_ip_all", "--auth"]