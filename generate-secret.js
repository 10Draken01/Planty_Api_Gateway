#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n🔐 Generador de JWT_SECRET seguro\n');
console.log('Copia este valor y úsalo como JWT_SECRET en Railway:\n');
console.log('─'.repeat(80));
console.log(crypto.randomBytes(64).toString('hex'));
console.log('─'.repeat(80));
console.log('\n✅ Este secreto es criptográficamente seguro y único\n');
