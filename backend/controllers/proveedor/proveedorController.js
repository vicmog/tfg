import { Proveedor } from "../../models/Proveedor.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    EMAIL_REGEX,
    PROVEEDOR_ERRORS,
    PROVEEDOR_MESSAGES,
    PROVEEDOR_ROLES,
} from "./constants.js";

const canManageProveedores = (rol) => [PROVEEDOR_ROLES.ADMIN, PROVEEDOR_ROLES.JEFE].includes(rol);

const serializeProveedor = (proveedor) => ({
    id_proveedor: proveedor.id_proveedor,
    id_negocio: proveedor.id_negocio,
    nombre: proveedor.nombre,
    cif_nif: proveedor.cif_nif,
    contacto: proveedor.contacto,
    telefono: proveedor.telefono,
    email: proveedor.email,
    tipo_proveedor: proveedor.tipo_proveedor,
    direccion: proveedor.direccion,
});

const validateProveedorFields = ({
    nombre,
    cif_nif,
    contacto,
    telefono,
    email,
    tipo_proveedor,
    direccion,
}) => {
    const nombreValue = typeof nombre === "string" ? nombre.trim() : "";
    const cifNifValue = typeof cif_nif === "string" ? cif_nif.trim() : "";
    const contactoValue = typeof contacto === "string" ? contacto.trim() : "";
    const telefonoValue = typeof telefono === "string" ? telefono.trim() : "";
    const emailValue = typeof email === "string" ? email.trim() : "";
    const tipoProveedorValue = typeof tipo_proveedor === "string" ? tipo_proveedor.trim() : "";
    const direccionValue = typeof direccion === "string" ? direccion.trim() : "";

    if (!nombreValue) {
        return { error: PROVEEDOR_ERRORS.NOMBRE_REQUIRED };
    }

    if (!cifNifValue) {
        return { error: PROVEEDOR_ERRORS.CIF_NIF_REQUIRED };
    }

    if (!contactoValue) {
        return { error: PROVEEDOR_ERRORS.CONTACTO_REQUIRED };
    }

    if (!tipoProveedorValue) {
        return { error: PROVEEDOR_ERRORS.TIPO_PROVEEDOR_REQUIRED };
    }

    if (!telefonoValue && !emailValue) {
        return { error: PROVEEDOR_ERRORS.CONTACT_METHOD_REQUIRED };
    }

    if (emailValue && !EMAIL_REGEX.test(emailValue)) {
        return { error: PROVEEDOR_ERRORS.INVALID_EMAIL };
    }

    return {
        value: {
            nombre: nombreValue,
            cif_nif: cifNifValue,
            contacto: contactoValue,
            telefono: telefonoValue || null,
            email: emailValue || null,
            tipo_proveedor: tipoProveedorValue,
            direccion: direccionValue || null,
        },
    };
};

export const createProveedor = async (req, res) => {
    const {
        id_negocio,
        nombre,
        cif_nif,
        contacto,
        telefono,
        email,
        tipo_proveedor,
        direccion,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: PROVEEDOR_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: PROVEEDOR_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    const proveedorFieldsResult = validateProveedorFields({
        nombre,
        cif_nif,
        contacto,
        telefono,
        email,
        tipo_proveedor,
        direccion,
    });

    if (proveedorFieldsResult.error) {
        return res.status(400).json({ message: proveedorFieldsResult.error });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: PROVEEDOR_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageProveedores(usuarioNegocio.rol)) {
            return res.status(403).json({ message: PROVEEDOR_ERRORS.NO_MANAGE_PERMISSION });
        }

        const proveedor = await Proveedor.create({
            id_negocio,
            ...proveedorFieldsResult.value,
        });

        return res.status(201).json({
            message: PROVEEDOR_MESSAGES.PROVEEDOR_CREATED,
            proveedor: serializeProveedor(proveedor),
        });
    } catch (error) {
        return res.status(500).json({ message: PROVEEDOR_ERRORS.SERVER_ERROR });
    }
};

export const getProveedoresByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: PROVEEDOR_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: PROVEEDOR_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: PROVEEDOR_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageProveedores(usuarioNegocio.rol)) {
            return res.status(403).json({ message: PROVEEDOR_ERRORS.NO_MANAGE_PERMISSION });
        }

        const proveedores = await Proveedor.findAll({
            where: { id_negocio },
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({ proveedores: proveedores.map(serializeProveedor) });
    } catch (error) {
        return res.status(500).json({ message: PROVEEDOR_ERRORS.SERVER_ERROR });
    }
};

export const deleteProveedor = async (req, res) => {
    const { id_proveedor } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: PROVEEDOR_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_proveedor) {
        return res.status(400).json({ message: PROVEEDOR_ERRORS.PROVEEDOR_ID_REQUIRED });
    }

    try {
        const proveedor = await Proveedor.findByPk(id_proveedor);

        if (!proveedor) {
            return res.status(404).json({ message: PROVEEDOR_ERRORS.PROVEEDOR_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: proveedor.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: PROVEEDOR_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageProveedores(usuarioNegocio.rol)) {
            return res.status(403).json({ message: PROVEEDOR_ERRORS.NO_MANAGE_PERMISSION });
        }

        await proveedor.destroy();

        return res.status(200).json({ message: PROVEEDOR_MESSAGES.PROVEEDOR_DELETED });
    } catch (error) {
        return res.status(500).json({ message: PROVEEDOR_ERRORS.SERVER_ERROR });
    }
};
