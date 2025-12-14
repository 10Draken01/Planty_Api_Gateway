const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

const payload = {
  userId: 'test-user-123',
  email: 'test@example.com'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('\n=== TOKEN GENERADO ===');
console.log(token);
console.log('\n=== PAYLOAD ===');
console.log(payload);
console.log('\n=== PARA PROBAR ===');
console.log(`curl -X POST http://localhost:3002/auth/validate \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -H "Content-Type: application/json"`);
console.log('\n');
