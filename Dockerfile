# Imagen oficial de MongoDB
FROM mongo:6.0

# Variables de entorno para inicializar el usuario root y la DB
ENV MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
ENV MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
ENV MONGO_INITDB_DATABASE=${MONGO_DB_NAME}

# Exponer el puerto interno
EXPOSE 27017

# MongoDB escuchando en todas las interfaces dentro de Railway
CMD ["mongod", "--bind_ip_all"]
