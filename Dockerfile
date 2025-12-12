# Imagen oficial de MongoDB
FROM mongo:6.0

# Variables opcionales para inicializar usuario y base
ENV MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
ENV MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
ENV MONGO_INITDB_DATABASE=${MONGO_DB_NAME}

# Persistencia (Railway puede mapear /data/db a almacenamiento persistente)
VOLUME /data/db

# Exponer puerto interno
EXPOSE 27017

# Ejecutar MongoDB escuchando en todas las interfaces internas
CMD ["mongod", "--bind_ip_all"]
