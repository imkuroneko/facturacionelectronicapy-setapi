# Guía de Migración: De Certificados PFX/P12 a CRT/KEY

## Resumen

Este documento describe el proceso de migración del uso de certificados en formato PFX/P12 a archivos separados de certificado (.crt) y clave privada (.key) en el módulo `facturacionelectronicapy-setapi`.

## Estado Actual

### Uso Actual de PFX/P12

Actualmente, el módulo utiliza certificados en formato PFX/P12 (PKCS#12) a través de la clase `PKCS12.ts`. Este formato:

- Empaqueta el certificado digital y la clave privada en un solo archivo
- Requiere una contraseña (passphrase) para desencriptar
- Utiliza la librería `node-forge` para extraer los componentes

### Flujo Actual de Trabajo

```typescript
// En PKCS12.ts
openFile(file: string, passphase: string) {
  // 1. Lee el archivo PFX/P12
  const pkcs12 = fs.readFileSync(file);
  
  // 2. Convierte a ASN.1
  this.p12Asn1 = forge.asn1.fromDer(pkcs12.toString("binary"));
  
  // 3. Extrae usando la contraseña (passphase en el código original)
  this.p12 = forge.pkcs12.pkcs12FromAsn1(this.p12Asn1, false, passphase);
}

// Extrae el certificado en formato PEM
getCertificate() {
  // Busca en los safeContents el certificado
  // Convierte a formato PEM usando forge.pki.certificateToPem()
}

// Extrae la clave privada en formato PEM
getPrivateKey() {
  // Busca en los safeContents la clave privada
  // Convierte a formato PEM usando forge.pki.privateKeyToPem()
}
```

### Uso en SET.ts

```typescript
// Método actual en SET.ts
abrir(certificado: any, passphase: string) {
  pkcs12.openFile(certificado, passphase);
  this.cert = pkcs12.getCertificate();  // Obtiene PEM del certificado
  this.key = pkcs12.getPrivateKey();    // Obtiene PEM de la clave privada
}

// Luego se utilizan para crear el agente HTTPS
const httpsAgent = new https.Agent({
  cert: Buffer.from(this.cert, "utf8"),
  key: Buffer.from(this.key, "utf8"),
});
```

## Estrategia de Migración

### Ventajas de Usar Archivos Separados (.crt y .key)

1. **Simplicidad**: No requiere librerías adicionales para extraer componentes
2. **Seguridad**: La clave privada se puede almacenar por separado con permisos más restrictivos
3. **Compatibilidad**: Formato estándar usado en servidores web y la mayoría de aplicaciones
4. **Rendimiento**: Eliminación del paso de extracción/conversión
5. **Mantenibilidad**: Código más simple y directo
6. **Reducción de dependencias**: Potencialmente eliminar la dependencia de `node-forge` si no se usa para otras funcionalidades

### Conversión de PFX/P12 a CRT/KEY

Si ya tienes un archivo PFX/P12, puedes convertirlo usando OpenSSL:

```bash
# Extraer el certificado (.crt)
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out certificado.crt

# Extraer la clave privada (.key)
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out certificado.key

# Si deseas que la clave privada esté protegida con contraseña (recomendado):
openssl pkcs12 -in certificado.pfx -nocerts -out certificado.key
```

### Implementación Propuesta

#### Opción 1: Refactorización Completa (Recomendada)

Modificar la clase `PKCS12.ts` para soportar ambos métodos o crear una nueva clase:

```typescript
import fs from "fs";

class CertificateManager {
  private cert: string | null = null;
  private key: string | null = null;

  /**
   * Carga certificado y clave desde archivos separados
   * @param certPath - Ruta al archivo .crt
   * @param keyPath - Ruta al archivo .key
   * @param keyPassword - Contraseña opcional si la clave privada está encriptada
   */
  loadFromFiles(certPath: string, keyPath: string, keyPassword?: string) {
    this.cert = fs.readFileSync(certPath, 'utf8');
    this.key = fs.readFileSync(keyPath, 'utf8');
    
    // Si la clave está encriptada y se proporciona contraseña,
    // node-forge puede desencriptarla si es necesario
    if (keyPassword) {
      // Implementar desencriptado si la clave privada está protegida
      // const forge = require('node-forge');
      // const privateKey = forge.pki.decryptRsaPrivateKey(this.key, keyPassword);
      // this.key = forge.pki.privateKeyToPem(privateKey);
    }
  }

  getCertificate(): string | null {
    return this.cert;
  }

  getPrivateKey(): string | null {
    return this.key;
  }

  clean() {
    this.cert = null;
    this.key = null;
  }
}

export default new CertificateManager();
```

#### Opción 2: Modificación Mínima (Compatibilidad hacia atrás)

Extender la clase PKCS12 existente para soportar ambos métodos:

```typescript
import fs from "fs";
import forge from "node-forge";

class PKCS12 {
  private p12Asn1: any;
  private p12: any;
  private certPem: string | null = null;
  private keyPem: string | null = null;

  // Métodos existentes para PFX/P12 (mantienen el nombre 'passphase' del código original)...
  openFile(file: string, passphase: string) {
    this.openCertificate(file);
    this.p12 = forge.pkcs12.pkcs12FromAsn1(this.p12Asn1, false, passphase);
  }

  // Nuevo método para cargar desde archivos separados
  openFromFiles(certPath: string, keyPath: string) {
    this.certPem = fs.readFileSync(certPath, 'utf8');
    this.keyPem = fs.readFileSync(keyPath, 'utf8');
  }

  getCertificate() {
    // Si se cargó desde archivos separados, devolver directamente
    if (this.certPem) {
      return this.certPem;
    }
    
    // Lógica existente para PFX/P12
    for (let i = 0; i < this.p12.safeContents.length; i++) {
      if (this.p12.safeContents[i].safeBags[0].cert) {
        return forge.pki.certificateToPem(
          this.p12.safeContents[i].safeBags[0].cert
        );
      }
    }
    return null;
  }

  getPrivateKey() {
    // Si se cargó desde archivos separados, devolver directamente
    if (this.keyPem) {
      return this.keyPem;
    }
    
    // Lógica existente para PFX/P12
    for (let i = 0; i < this.p12.safeContents.length; i++) {
      if (this.p12.safeContents[i].safeBags[0].key) {
        return forge.pki.privateKeyToPem(
          this.p12.safeContents[i].safeBags[0].key
        );
      }
    }
    return null;
  }
}

export default new PKCS12();
```

#### Modificación en SET.ts

```typescript
// Método adicional para usar archivos separados
abrirConArchivos(certPath: string, keyPath: string) {
  pkcs12.openFromFiles(certPath, keyPath);
  this.cert = pkcs12.getCertificate();
  this.key = pkcs12.getPrivateKey();
}

// Los métodos existentes (consulta, recibe, etc.) se mantienen sin cambios
// ya que solo usan this.cert y this.key
```

#### Actualización de la API Pública (index.ts)

```typescript
class SetAPI {
  // Métodos existentes que usan PFX/P12...
  
  // Nuevos métodos que aceptan rutas de archivos
  consultaConArchivos = (
    id: number,
    cdc: string,
    env: "test" | "prod",
    certPath: string,
    keyPath: string,
    config?: SetApiConfig
  ): Promise<any> => {
    return set.consultaConArchivos(id, cdc, env, certPath, keyPath, config);
  };
  
  // ... Similar para otros métodos
}
```

## Consideraciones de Seguridad

### PFX/P12
- ✅ Un solo archivo para gestionar
- ✅ Protegido por contraseña
- ❌ Si se compromete el archivo + contraseña, ambos elementos están expuestos

### CRT/KEY Separados
- ✅ La clave privada puede tener permisos más restrictivos (chmod 600)
- ✅ El certificado puede ser público (chmod 644)
- ✅ Rotación más sencilla de certificados
- ⚠️ Requiere proteger adecuadamente la clave privada

### Recomendaciones

1. **Permisos de archivos**:
   ```bash
   chmod 644 certificado.crt  # Legible por todos
   chmod 600 certificado.key  # Solo lectura/escritura por el propietario
   ```

2. **Variables de entorno**: Almacenar rutas de archivos en variables de entorno
   ```javascript
   const certPath = process.env.SSL_CERT_PATH || './certs/certificado.crt';
   const keyPath = process.env.SSL_KEY_PATH || './certs/certificado.key';
   ```

3. **No commitear claves privadas**: Añadir a `.gitignore`
   ```
   *.key
   *.pfx
   *.p12
   certs/
   ```

## Plan de Migración Gradual

### Fase 1: Implementación (Recomendado)
1. Implementar Opción 2 (compatibilidad hacia atrás)
2. Añadir tests para ambos métodos
3. Actualizar documentación

### Fase 2: Transición
1. Proporcionar herramientas/scripts de conversión
2. Actualizar ejemplos con el nuevo método
3. Marcar métodos PFX/P12 como deprecated

### Fase 3: Deprecación (Opcional, a largo plazo)
1. Anunciar deprecación de métodos PFX/P12
2. Período de gracia (6-12 meses)
3. Eliminar soporte PFX/P12 en versión mayor

## Ejemplo de Uso

### Antes (PFX/P12)

```typescript
import setApi from 'facturacionelectronicapy-setapi';

const result = await setApi.consulta(
  1,
  'CDC123456789',
  'test',
  './certificado.pfx',  // Archivo PFX
  'mi-contraseña',       // Contraseña del PFX
  { debug: true }
);
```

### Después (CRT/KEY)

```typescript
import setApi from 'facturacionelectronicapy-setapi';

const result = await setApi.consultaConArchivos(
  1,
  'CDC123456789',
  'test',
  './certs/certificado.crt',  // Archivo del certificado
  './certs/certificado.key',  // Archivo de clave privada
  { debug: true }
);
```

## Impacto en Dependencias

Si se adopta completamente el uso de archivos separados:

- **node-forge**: Podría volverse opcional si solo se usa para PFX/P12
- **Beneficio**: Reducción del tamaño del bundle y menor superficie de ataque
- **Consideración**: La función `signature()` en PKCS12.ts usa node-forge, por lo que la dependencia aún podría ser necesaria

## Conclusión

La migración de PFX/P12 a archivos separados CRT/KEY ofrece beneficios en:
- Simplicidad del código
- Seguridad (separación de componentes)
- Compatibilidad con estándares de la industria
- Rendimiento (eliminación de paso de extracción)

Se recomienda implementar la **Opción 2** para mantener compatibilidad hacia atrás mientras se facilita la migración gradual de los usuarios del módulo.

## Referencias

- [OpenSSL PKCS12 Commands](https://www.openssl.org/docs/man1.1.1/man1/pkcs12.html)
- [Node.js HTTPS Agent Options](https://nodejs.org/api/https.html#https_https_request_options_callback)
- [Node-Forge Documentation](https://github.com/digitalbazaar/forge)
