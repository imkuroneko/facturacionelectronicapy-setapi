# Facturación Electrónica - API SET v2

Esta versión (v2) implementa el consumo de certificados utilizando archivos separados `.crt` (o `.pem`) y `.key`, reemplazando completamente el uso de archivos PFX/P12.

## ⚠️ Cambios Importantes (Breaking Changes)

### Versión Anterior (v1)
```typescript
import setApi from 'facturacionelectronicapy-setapi';

// Usando archivo PFX/P12 con contraseña
const result = await setApi.consulta(
  1,
  'CDC123456789',
  'test',
  './certificado.pfx',  // Archivo PFX
  'mi-contraseña',      // Contraseña del PFX
  { debug: true }
);
```

### Versión Nueva (v2)
```typescript
import setApi from 'facturacionelectronicapy-setapi';

// Usando archivos separados .crt y .key
const result = await setApi.consulta(
  1,
  'CDC123456789',
  'test',
  './certs/certificado.crt',  // Archivo del certificado (.crt o .pem)
  './certs/certificado.key',  // Archivo de clave privada (.key)
  { debug: true }
);
```

## 🔄 Conversión de PFX/P12 a CRT/KEY

Si ya tienes un archivo PFX/P12, puedes convertirlo usando OpenSSL:

```bash
# Extraer el certificado (.crt)
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out certificado.crt

# Extraer la clave privada (.key) sin protección
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out certificado.key

# O extraer la clave privada (.key) con protección por contraseña (recomendado)
openssl pkcs12 -in certificado.pfx -nocerts -out certificado.key
```

## 📚 API Actualizada

Todas las funciones ahora reciben `certPath` y `keyPath` en lugar de `certificado` y `passphase`:

### Consulta CDC
```typescript
setApi.consulta(
  id: number,
  cdc: string,
  env: "test" | "prod",
  certPath: string,      // Ruta al archivo .crt o .pem
  keyPath: string,       // Ruta al archivo .key
  config?: SetApiConfig
): Promise<any>
```

### Consulta RUC
```typescript
setApi.consultaRUC(
  id: number,
  ruc: string,
  env: "test" | "prod",
  certPath: string,
  keyPath: string,
  config?: SetApiConfig
): Promise<any>
```

### Consulta Lote
```typescript
setApi.consultaLote(
  id: number,
  numeroLote: number,
  env: "test" | "prod",
  certPath: string,
  keyPath: string,
  config?: SetApiConfig
): Promise<any>
```

### Recibe Documento
```typescript
setApi.recibe(
  id: number,
  xml: string,
  env: "test" | "prod",
  certPath: string,
  keyPath: string,
  config?: SetApiConfig
): Promise<any>
```

### Recibe Lote
```typescript
setApi.recibeLote(
  id: number,
  xml: string[],
  env: "test" | "prod",
  certPath: string,
  keyPath: string,
  config?: SetApiConfig
): Promise<any>
```

### Evento
```typescript
setApi.evento(
  id: number,
  xml: string,
  env: "test" | "prod",
  certPath: string,
  keyPath: string,
  config?: SetApiConfig
): Promise<any>
```

## ✅ Ventajas de v2

1. **Simplicidad**: No requiere extracción de componentes del archivo PFX
2. **Seguridad**: La clave privada puede almacenarse con permisos más restrictivos
3. **Rendimiento**: Eliminación del paso de extracción/conversión
4. **Compatibilidad**: Formato estándar usado en la mayoría de aplicaciones
5. **Mantenibilidad**: Código más simple y directo

## 🔐 Recomendaciones de Seguridad

### Permisos de Archivos
```bash
# Certificado público (puede ser legible por todos)
chmod 644 certificado.crt

# Clave privada (solo lectura/escritura para el propietario)
chmod 600 certificado.key
```

### Variables de Entorno
Se recomienda usar variables de entorno para las rutas de los certificados:

```typescript
const certPath = process.env.SSL_CERT_PATH || './certs/certificado.crt';
const keyPath = process.env.SSL_KEY_PATH || './certs/certificado.key';

const result = await setApi.consulta(
  1,
  'CDC123456789',
  'test',
  certPath,
  keyPath
);
```

### .gitignore
No commitear claves privadas al repositorio:

```
# Certificados y claves
*.key
*.pfx
*.p12
certs/
```

## 📝 Ejemplo Completo

```typescript
import setApi from 'facturacionelectronicapy-setapi';

async function consultarDocumento() {
  try {
    const resultado = await setApi.consulta(
      1,                                    // ID de la consulta
      '01800695631001001000002820231020',  // CDC del documento
      'test',                               // Ambiente: 'test' o 'prod'
      './certs/certificado.crt',           // Ruta al certificado
      './certs/certificado.key',           // Ruta a la clave privada
      {
        debug: true,                        // Opcional: modo debug
        timeout: 90000                      // Opcional: timeout en ms
      }
    );
    
    console.log('Resultado:', resultado);
  } catch (error) {
    console.error('Error:', error);
  }
}

consultarDocumento();
```

## 🔧 Cambios Internos

### CertificateManager (antiguo PKCS12.ts)
La clase ahora se llama `CertificateManager` y tiene un método simplificado:

```typescript
// Antes (PFX/P12)
pkcs12.openFile(file: string, passphase: string)

// Ahora (CRT/KEY)
certificateManager.openFromFiles(certPath: string, keyPath: string)
```

### SET.ts
El método `abrir` ahora acepta rutas de archivos:

```typescript
// Antes
abrir(certificado: any, passphase: string)

// Ahora
abrir(certPath: string, keyPath: string)
```

## 📦 Dependencias

La dependencia `node-forge` se mantiene únicamente para la función `signature()` que se utiliza internamente para firmar XMLs con SHA256.

## 🚀 Migración

Para migrar de v1 a v2:

1. Convierte tu archivo PFX/P12 a archivos separados usando OpenSSL
2. Actualiza tus llamadas a la API para pasar `certPath` y `keyPath` en lugar de `certificado` y `passphase`
3. Configura permisos adecuados para los archivos
4. Actualiza tu `.gitignore` para no commitear las claves privadas

## 📄 Licencia

MIT

## 👤 Autor

KuroNeko

## 🔗 Enlaces

- [Repositorio](https://github.com/imkuroneko/facturacionelectronicapy-setapi)
- [Documentación de Migración](./migration.md)
