import { Cliente } from "../../models/Cliente.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    CLIENTE_ERRORS,
    CLIENTE_MESSAGES,
    EMAIL_REGEX,
} from "./constants.js";

const hasAccessToNegocio = async (id_usuario, id_negocio) => {
    const usuarioNegocio = await UsuarioNegocio.findOne({
        where: { id_usuario, id_negocio },
    });

    return !!usuarioNegocio;
};

export const createCliente = async (req, res) => {
    const {
        id_negocio,
        nombre,
        apellido1,
        apellido2,
        email,
        numero_telefono,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: CLIENTE_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: CLIENTE_ERRORS.NOMBRE_REQUIRED });
    }

    if (!apellido1 || !apellido1.trim()) {
        return res.status(400).json({ message: CLIENTE_ERRORS.APELLIDO1_REQUIRED });
    }

    const emailValue = typeof email === "string" ? email.trim() : "";
    const telefonoValue = typeof numero_telefono === "string" ? numero_telefono.trim() : "";

    if (!emailValue && !telefonoValue) {
        return res.status(400).json({ message: CLIENTE_ERRORS.CONTACT_REQUIRED });
    }

    if (emailValue && !EMAIL_REGEX.test(emailValue)) {
        return res.status(400).json({ message: CLIENTE_ERRORS.INVALID_EMAIL });
    }

    try {
        const hasAccess = await hasAccessToNegocio(id_usuario, id_negocio);
        if (!hasAccess) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const cliente = await Cliente.create({
            id_negocio,
            nombre: nombre.trim(),
            apellido1: apellido1.trim(),
            apellido2: typeof apellido2 === "string" ? apellido2.trim() : null,
            email: emailValue || null,
            numero_telefono: telefonoValue || null,
        });

        return res.status(201).json({
            message: CLIENTE_MESSAGES.CLIENTE_CREATED,
            cliente: {
                id_cliente: cliente.id_cliente,
                id_negocio: cliente.id_negocio,
                nombre: cliente.nombre,
                apellido1: cliente.apellido1,
                apellido2: cliente.apellido2,
                email: cliente.email,
                numero_telefono: cliente.numero_telefono,
                bloqueado: cliente.bloqueado,
            },
        });
    } catch (error) {
        console.error("Error al crear cliente:", error);
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};

export const getClientesByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: CLIENTE_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const hasAccess = await hasAccessToNegocio(id_usuario, id_negocio);
        if (!hasAccess) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const clientes = await Cliente.findAll({
            where: { id_negocio },
            order: [["createdAt", "DESC"]],
        });

        const compactClientes = clientes.map((cliente) => ({
            id_cliente: cliente.id_cliente,
            id_negocio: cliente.id_negocio,
            nombre: cliente.nombre,
            apellido1: cliente.apellido1,
            apellido2: cliente.apellido2,
            email: cliente.email,
            numero_telefono: cliente.numero_telefono,
            bloqueado: cliente.bloqueado,
        }));

        return res.status(200).json({ clientes: compactClientes });
    } catch (error) {
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};

export const updateCliente = async (req, res) => {
    const { id_cliente } = req.params;
    const {
        nombre,
        apellido1,
        apellido2,
        email,
        numero_telefono,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_cliente) {
        return res.status(400).json({ message: CLIENTE_ERRORS.CLIENTE_ID_REQUIRED });
    }

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: CLIENTE_ERRORS.NOMBRE_REQUIRED });
    }

    if (!apellido1 || !apellido1.trim()) {
        return res.status(400).json({ message: CLIENTE_ERRORS.APELLIDO1_REQUIRED });
    }

    const emailValue = typeof email === "string" ? email.trim() : "";
    const telefonoValue = typeof numero_telefono === "string" ? numero_telefono.trim() : "";

    if (!emailValue && !telefonoValue) {
        return res.status(400).json({ message: CLIENTE_ERRORS.CONTACT_REQUIRED });
    }

    if (emailValue && !EMAIL_REGEX.test(emailValue)) {
        return res.status(400).json({ message: CLIENTE_ERRORS.INVALID_EMAIL });
    }

    try {
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return res.status(404).json({ message: CLIENTE_ERRORS.CLIENTE_NOT_FOUND });
        }

        const hasAccess = await hasAccessToNegocio(id_usuario, cliente.id_negocio);
        if (!hasAccess) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        await cliente.update({
            nombre: nombre.trim(),
            apellido1: apellido1.trim(),
            apellido2: typeof apellido2 === "string" ? apellido2.trim() || null : null,
            email: emailValue || null,
            numero_telefono: telefonoValue || null,
        });

        return res.status(200).json({
            message: CLIENTE_MESSAGES.CLIENTE_UPDATED,
            cliente: {
                id_cliente: cliente.id_cliente,
                id_negocio: cliente.id_negocio,
                nombre: cliente.nombre,
                apellido1: cliente.apellido1,
                apellido2: cliente.apellido2,
                email: cliente.email,
                numero_telefono: cliente.numero_telefono,
                bloqueado: cliente.bloqueado,
            },
        });
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};

export const deleteCliente = async (req, res) => {
    const { id_cliente } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_cliente) {
        return res.status(400).json({ message: CLIENTE_ERRORS.CLIENTE_ID_REQUIRED });
    }

    try {
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return res.status(404).json({ message: CLIENTE_ERRORS.CLIENTE_NOT_FOUND });
        }

        const hasAccess = await hasAccessToNegocio(id_usuario, cliente.id_negocio);
        if (!hasAccess) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        await cliente.destroy();

        return res.status(200).json({ message: CLIENTE_MESSAGES.CLIENTE_DELETED });
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};
