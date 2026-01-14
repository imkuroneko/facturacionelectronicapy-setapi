import fs from "fs";
import forge from "node-forge";

class CertificateManager {
  private certPem: string | null = null;
  private keyPem: string | null = null;

  /**
   * Carga certificado y clave privada desde archivos separados
   * @param certPath - Ruta al archivo .crt o .pem del certificado
   * @param keyPath - Ruta al archivo .key de la clave privada
   */
  openFromFiles(certPath: string, keyPath: string) {
    this.certPem = fs.readFileSync(certPath, "utf8");
    this.keyPem = fs.readFileSync(keyPath, "utf8");
  }

  clean() {
    this.certPem = null;
    this.keyPem = null;
  }

  getPrivateKey(): string | null {
    return this.keyPem;
  }

  getCertificate(): string | null {
    return this.certPem;
  }

  signature(xml: string, privateKey: any) {
    const md = forge.md.sha256.create();
    md.update(xml, "utf8");
    const key = forge.pki.privateKeyFromPem(privateKey);
    return key.sign(md);
  }
}

export default new CertificateManager();
