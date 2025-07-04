#!/usr/bin/env node

/**
 * Test Script para el Cloudflare Worker corregido
 * Simula las requests que están causando el error 500
 */

// Simulación básica del entorno de Cloudflare Worker
class MockEnv {
  constructor() {
    this.SUPABASE_URL = 'https://xyzabc123.supabase.co'; // Mock URL
    this.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiJ9.mock-key'; // Mock key
  }
}

class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map();
    this.body = options.body;
    
    // Set headers
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        this.headers.set(key, value);
      }
    }
  }

  async json() {
    if (this.body) {
      return JSON.parse(this.body);
    }
    throw new Error('No body to parse');
  }

  async text() {
    return this.body || '';
  }
}

// Headers polyfill
globalThis.Headers = globalThis.Headers || class Headers {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      for (const [key, value] of Object.entries(init)) {
        this.headers.set(key.toLowerCase(), value);
      }
    }
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  get(name) {
    return this.headers.get(name.toLowerCase());
  }

  entries() {
    return this.headers.entries();
  }
};

// Response polyfill
globalThis.Response = globalThis.Response || class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.headers = new Headers(options.headers);
  }
};

// Fetch polyfill (mock)
globalThis.fetch = globalThis.fetch || async function(url, options) {
  console.log('🌐 MOCK FETCH:', options?.method || 'GET', url);
  
  // Simular respuestas de Supabase
  if (url.includes('/auth/v1/token')) {
    if (options.body.includes('test@cupo.dev')) {
      return new Response(JSON.stringify({
        user: { id: 'mock-user-123', email: 'test@cupo.dev' },
        access_token: 'mock-token'
      }));
    } else {
      return new Response(JSON.stringify({
        error: 'invalid_credentials',
        error_description: 'Invalid login credentials'
      }), { status: 400 });
    }
  }
  
  if (url.includes('/rest/v1/users')) {
    return new Response(JSON.stringify([
      { id: 'mock-user-123', status: 'temporarily_deactivated' }
    ]));
  }
  
  return new Response('{}');
};

// Importar el worker
async function loadWorker() {
  try {
    const fs = await import('fs');
    const workerCode = fs.readFileSync('/Users/prueba/Desktop/Cupo/cloudflare-worker-fixed.js', 'utf8');
    
    // Evaluar el código del worker
    const module = eval(`(function() {
      ${workerCode}
      return { default: typeof exports !== 'undefined' ? exports.default : (typeof module !== 'undefined' ? module.exports.default : null) };
    })()`);
    
    return module.default;
  } catch (error) {
    console.error('❌ Error loading worker:', error);
    return null;
  }
}

// Tests
async function runTests() {
  console.log('🧪 Starting Cloudflare Worker Tests...\n');
  
  const worker = await loadWorker();
  if (!worker) {
    console.error('❌ Failed to load worker');
    return;
  }

  const env = new MockEnv();
  const ctx = {};

  // Test 1: Health Check
  console.log('🏥 Test 1: Health Check');
  try {
    const request = new MockRequest('https://worker.example.com/health', {
      method: 'GET',
      headers: { 'Origin': 'http://localhost:5176' }
    });
    
    const response = await worker.fetch(request, env, ctx);
    const data = JSON.parse(response.body);
    
    console.log('✅ Health check passed:', data.status);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }

  // Test 2: OPTIONS (CORS preflight)
  console.log('\n🔀 Test 2: CORS Preflight');
  try {
    const request = new MockRequest('https://worker.example.com/auth/recover-account', {
      method: 'OPTIONS',
      headers: { 'Origin': 'http://localhost:5176' }
    });
    
    const response = await worker.fetch(request, env, ctx);
    console.log('✅ CORS preflight passed, status:', response.status);
  } catch (error) {
    console.error('❌ CORS preflight failed:', error.message);
  }

  // Test 3: Recover Account - Valid credentials
  console.log('\n🔄 Test 3: Account Recovery (Valid)');
  try {
    const request = new MockRequest('https://worker.example.com/auth/recover-account', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5176'
      },
      body: JSON.stringify({
        email: 'test@cupo.dev',
        password: 'testpassword123'
      })
    });
    
    const response = await worker.fetch(request, env, ctx);
    const data = JSON.parse(response.body);
    
    if (response.status === 200 && data.success) {
      console.log('✅ Account recovery passed');
    } else {
      console.log('⚠️ Account recovery response:', data);
    }
  } catch (error) {
    console.error('❌ Account recovery failed:', error.message);
  }

  // Test 4: Recover Account - Invalid credentials
  console.log('\n🔄 Test 4: Account Recovery (Invalid)');
  try {
    const request = new MockRequest('https://worker.example.com/auth/recover-account', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5176'
      },
      body: JSON.stringify({
        email: 'invalid@cupo.dev',
        password: 'wrongpassword'
      })
    });
    
    const response = await worker.fetch(request, env, ctx);
    const data = JSON.parse(response.body);
    
    if (response.status === 401) {
      console.log('✅ Invalid credentials handled correctly');
    } else {
      console.log('⚠️ Unexpected response:', data);
    }
  } catch (error) {
    console.error('❌ Invalid credentials test failed:', error.message);
  }

  // Test 5: Recover Account - Malformed JSON
  console.log('\n🔄 Test 5: Account Recovery (Malformed JSON)');
  try {
    const request = new MockRequest('https://worker.example.com/auth/recover-account', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5176'
      },
      body: '{"email": invalid json'
    });
    
    const response = await worker.fetch(request, env, ctx);
    const data = JSON.parse(response.body);
    
    if (response.status === 400) {
      console.log('✅ Malformed JSON handled correctly');
    } else {
      console.log('⚠️ Unexpected response:', data);
    }
  } catch (error) {
    console.error('❌ Malformed JSON test failed:', error.message);
  }

  // Test 6: Missing environment variables
  console.log('\n🔄 Test 6: Missing Environment Variables');
  try {
    const request = new MockRequest('https://worker.example.com/auth/recover-account', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5176'
      },
      body: JSON.stringify({
        email: 'test@cupo.dev',
        password: 'testpassword123'
      })
    });
    
    const emptyEnv = {}; // Sin variables de entorno
    const response = await worker.fetch(request, emptyEnv, ctx);
    const data = JSON.parse(response.body);
    
    if (response.status === 500 && data.error.includes('configuración')) {
      console.log('✅ Missing env vars handled correctly');
    } else {
      console.log('⚠️ Unexpected response:', data);
    }
  } catch (error) {
    console.error('❌ Missing env vars test failed:', error.message);
  }

  console.log('\n🎉 Tests completed!');
}

// Ejecutar tests
runTests().catch(console.error);
