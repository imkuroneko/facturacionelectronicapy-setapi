import set from "./SET";
import { SetApiConfig } from "./type.interface.";

class SetAPI {
  consulta = (
    id: number,
    cdc: string,
    env: "test" | "prod",
    certPath: string,
    keyPath: string,
    config?: SetApiConfig
  ): Promise<any> => {
    return set.consulta(id, cdc, env, certPath, keyPath, config);
  };
  consultaRUC = (
    id: number,
    ruc: string,
    env: "test" | "prod",
    certPath: string,
    keyPath: string,
    config?: SetApiConfig
  ): Promise<any> => {
    return set.consultaRUC(id, ruc, env, certPath, keyPath, config);
  };
  consultaLote = (
    id: number,
    numeroLote: number,
    env: "test" | "prod",
    certPath: string,
    keyPath: string,
    config?: SetApiConfig
  ): Promise<any> => {
    return set.consultaLote(id, numeroLote, env, certPath, keyPath, config);
  };
  recibe = (
    id: number,
    xml: string,
    env: "test" | "prod",
    certPath: string,
    keyPath: string,
    config?: SetApiConfig
  ): Promise<any> => {
    return set.recibe(id, xml, env, certPath, keyPath, config);
  };
  recibeLote = (
    id: number,
    xml: string[],
    env: "test" | "prod",
    certPath: string,
    keyPath: string,
    config?: SetApiConfig
  ): Promise<any> => {
    return set.recibeLote(id, xml, env, certPath, keyPath, config);
  };
  evento = (
    id: number,
    xml: string,
    env: "test" | "prod",
    certPath: string,
    keyPath: string,
    config?: SetApiConfig
  ): Promise<any> => {
    return set.evento(id, xml, env, certPath, keyPath, config);
  };
}

export default new SetAPI();
