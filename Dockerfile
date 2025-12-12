FROM mongo:6.0

# Railway inyectará estas variables desde el panel
ENV MONGO_INITDB_ROOT_USERNAME=$MONGO_INITDB_ROOT_USERNAME
ENV MONGO_INITDB_ROOT_PASSWORD=$MONGO_INITDB_ROOT_PASSWORD
ENV MONGO_INITDB_DATABASE=$MONGO_INITDB_DATABASE

# Puerto interno de Mongo
EXPOSE 27017

# Iniciar MongoDB con autenticación y accesible dentro de la red interna
CMD ["mongod", "--bind_ip_all"]
