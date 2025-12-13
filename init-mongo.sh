#!/bin/bash
set -e

mongosh <<EOF
use admin
db.createUser({
  user: '$MONGO_INITDB_ROOT_USERNAME',
  pwd: '$MONGO_INITDB_ROOT_PASSWORD',
  roles: [
    { role: 'root', db: 'admin' },
    { role: 'readWrite', db: '$MONGO_INITDB_DATABASE' }
  ]
})
EOF