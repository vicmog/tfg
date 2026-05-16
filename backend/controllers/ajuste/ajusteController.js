import { Ajuste } from "../../models/Ajuste.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
  AJUSTE_ERRORS,
  AJUSTE_MESSAGES,
  AJUSTE_ROLES,
  AJUSTE_MODULE_FIELDS,
} from "./constants.js";

const INTEGER_REGEX = /^\d+$/;

const normalizeNegocioId = (value) => {
  const negocioIdValue = `${value ?? ""}`.trim();

  if (!negocioIdValue) {
    return { error: AJUSTE_ERRORS.NEGOCIO_ID_REQUIRED };
  }

  if (!INTEGER_REGEX.test(negocioIdValue)) {
    return { error: AJUSTE_ERRORS.NEGOCIO_ID_INVALID };
  }

  return { value: Number.parseInt(negocioIdValue, 10) };
};

const serializeAjuste = (ajuste) => ({
  id_ajuste: ajuste.id_ajuste,
  id_negocio: ajuste.id_negocio,
  modulo_gastos: Boolean(ajuste.modulo_gastos),
  modulo_clientes: Boolean(ajuste.modulo_clientes),
  modulo_empleados: Boolean(ajuste.modulo_empleados),
  modulo_servicios: Boolean(ajuste.modulo_servicios),
  modulo_recursos: Boolean(ajuste.modulo_recursos),
  modulo_productos: Boolean(ajuste.modulo_productos),
  modulo_proveedores: Boolean(ajuste.modulo_proveedores),
  modulo_compras: Boolean(ajuste.modulo_compras),
  modulo_descuentos: Boolean(ajuste.modulo_descuentos),
  modulo_ventas: Boolean(ajuste.modulo_ventas),
  modulo_reservas: Boolean(ajuste.modulo_reservas),
  modulo_estadisticas: Boolean(ajuste.modulo_estadisticas),
});

const getAccessToNegocio = async (id_usuario, id_negocio) => {
  return UsuarioNegocio.findOne({
    where: { id_usuario, id_negocio },
  });
};

export const getAjustesByNegocio = async (req, res) => {
  const id_usuario = req.user?.id_usuario;
  const negocioIdResult = normalizeNegocioId(req.params.id_negocio);

  if (!id_usuario) {
    return res.status(401).json({ message: AJUSTE_ERRORS.USER_NOT_AUTHENTICATED });
  }

  if (negocioIdResult.error) {
    return res.status(400).json({ message: negocioIdResult.error });
  }

  try {
    const id_negocio = negocioIdResult.value;

    const usuarioNegocio = await getAccessToNegocio(id_usuario, id_negocio);
    if (!usuarioNegocio) {
      return res.status(403).json({ message: AJUSTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
    }

    const [ajuste] = await Ajuste.findOrCreate({
      where: { id_negocio },
      defaults: { id_negocio },
    });

    return res.status(200).json({
      message: AJUSTE_MESSAGES.AJUSTE_RETRIEVED,
      ajuste: serializeAjuste(ajuste),
    });
  } catch (error) {
    return res.status(500).json({ message: AJUSTE_ERRORS.SERVER_ERROR });
  }
};

export const updateAjustesByNegocio = async (req, res) => {
  const id_usuario = req.user?.id_usuario;
  const negocioIdResult = normalizeNegocioId(req.params.id_negocio);

  if (!id_usuario) {
    return res.status(401).json({ message: AJUSTE_ERRORS.USER_NOT_AUTHENTICATED });
  }

  if (negocioIdResult.error) {
    return res.status(400).json({ message: negocioIdResult.error });
  }

  try {
    const id_negocio = negocioIdResult.value;

    const usuarioNegocio = await getAccessToNegocio(id_usuario, id_negocio);
    if (!usuarioNegocio) {
      return res.status(403).json({ message: AJUSTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
    }

    const normalizedRole = `${usuarioNegocio.rol ?? ""}`.toLowerCase();
    if (normalizedRole !== AJUSTE_ROLES.ADMIN) {
      return res.status(403).json({ message: AJUSTE_ERRORS.NO_MANAGE_PERMISSION });
    }

    const payload = {};
    for (const field of AJUSTE_MODULE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (typeof req.body[field] !== "boolean") {
          return res.status(400).json({ message: AJUSTE_ERRORS.INVALID_BOOLEAN_FIELD });
        }
        payload[field] = req.body[field];
      }
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: AJUSTE_ERRORS.NO_FIELDS_TO_UPDATE });
    }

    const [ajuste] = await Ajuste.findOrCreate({
      where: { id_negocio },
      defaults: { id_negocio },
    });

    await ajuste.update(payload);

    return res.status(200).json({
      message: AJUSTE_MESSAGES.AJUSTE_UPDATED,
      ajuste: serializeAjuste(ajuste),
    });
  } catch (error) {
    return res.status(500).json({ message: AJUSTE_ERRORS.SERVER_ERROR });
  }
};
