import { Cliente } from "../../models/Cliente.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import { Op } from "sequelize";
import { sendClienteEmail } from "../../utils/mailer.js";
import {
    CLIENTE_ERRORS,
    CLIENTE_MESSAGES,
    CLIENTE_ROLES,
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
        bloqueado,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_cliente) {
        return res.status(400).json({ message: CLIENTE_ERRORS.CLIENTE_ID_REQUIRED });
    }

    const hasProfileData = [nombre, apellido1, apellido2, email, numero_telefono].some((value) => value !== undefined);
    const hasBlockData = bloqueado !== undefined;

    if (!hasProfileData && !hasBlockData) {
        return res.status(400).json({ message: CLIENTE_ERRORS.NO_UPDATE_DATA });
    }

    if (hasBlockData && typeof bloqueado !== "boolean") {
        return res.status(400).json({ message: CLIENTE_ERRORS.BLOCKED_INVALID });
    }

    let emailValue = "";
    let telefonoValue = "";

    if (hasProfileData) {
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ message: CLIENTE_ERRORS.NOMBRE_REQUIRED });
        }

        if (!apellido1 || !apellido1.trim()) {
            return res.status(400).json({ message: CLIENTE_ERRORS.APELLIDO1_REQUIRED });
        }

        emailValue = typeof email === "string" ? email.trim() : "";
        telefonoValue = typeof numero_telefono === "string" ? numero_telefono.trim() : "";

        if (!emailValue && !telefonoValue) {
            return res.status(400).json({ message: CLIENTE_ERRORS.CONTACT_REQUIRED });
        }

        if (emailValue && !EMAIL_REGEX.test(emailValue)) {
            return res.status(400).json({ message: CLIENTE_ERRORS.INVALID_EMAIL });
        }
    }

    try {
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return res.status(404).json({ message: CLIENTE_ERRORS.CLIENTE_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: cliente.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (hasBlockData) {
            const canBlockCliente = [CLIENTE_ROLES.JEFE, CLIENTE_ROLES.ADMIN].includes(usuarioNegocio.rol);
            if (!canBlockCliente) {
                return res.status(403).json({ message: CLIENTE_ERRORS.NO_BLOCK_PERMISSION });
            }
        }

        const updateData = {};

        if (hasProfileData) {
            updateData.nombre = nombre.trim();
            updateData.apellido1 = apellido1.trim();
            updateData.apellido2 = typeof apellido2 === "string" ? apellido2.trim() || null : null;
            updateData.email = emailValue || null;
            updateData.numero_telefono = telefonoValue || null;
        }

        if (hasBlockData) {
            updateData.bloqueado = bloqueado;
        }

        await cliente.update(updateData);

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
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};

export const deleteCliente = async (req, res) => {
    const { id_cliente } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
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
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};

export const searchClientes = async (req, res) => {
    const { id_negocio } = req.params;
    const searchTerm = typeof req.query.searchTerm === "string" ? req.query.searchTerm.trim() : "";
    const id_usuario = req.user?.id_usuario || "";

    if(!id_negocio){
        return res.status(400).json({ message: CLIENTE_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    if(!id_usuario){
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
    }

    try {
        const hasAccess = await hasAccessToNegocio(id_usuario, id_negocio);
        if (!hasAccess) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!searchTerm) {
            return res.status(200).json({ clientes: [] });
        }

        const clientes = await Cliente.findAll({
            where: {
                id_negocio: id_negocio,
                [Op.or]:[
                    {nombre:{[Op.like]: `%${searchTerm}%`}},
                    {numero_telefono:{[Op.like]: `%${searchTerm}%`}}
                ]
            },
        });

        return res.status(200).json({ clientes });
    } catch (error) {
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};

export const sendClienteEmailToCliente = async (req, res) => {
    const { id_cliente } = req.params;
    const { asunto, mensaje, adjuntos } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: CLIENTE_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_cliente) {
        return res.status(400).json({ message: CLIENTE_ERRORS.CLIENTE_ID_REQUIRED });
    }

    const asuntoValue = typeof asunto === "string" ? asunto.trim() : "";
    const mensajeValue = typeof mensaje === "string" ? mensaje.trim() : "";

    if (!asuntoValue) {
        return res.status(400).json({ message: CLIENTE_ERRORS.EMAIL_SUBJECT_REQUIRED });
    }

    if (!mensajeValue) {
        return res.status(400).json({ message: CLIENTE_ERRORS.EMAIL_MESSAGE_REQUIRED });
    }

    if (adjuntos !== undefined && !Array.isArray(adjuntos)) {
        return res.status(400).json({ message: CLIENTE_ERRORS.EMAIL_ATTACHMENTS_INVALID });
    }

    const hasInvalidAttachment = Array.isArray(adjuntos)
        && adjuntos.some((adjunto) => typeof adjunto !== "string" || !adjunto.trim());

    if (hasInvalidAttachment) {
        return res.status(400).json({ message: CLIENTE_ERRORS.EMAIL_ATTACHMENTS_INVALID });
    }

    try {
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return res.status(404).json({ message: CLIENTE_ERRORS.CLIENTE_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: cliente.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        const canSendEmail = [CLIENTE_ROLES.JEFE, CLIENTE_ROLES.ADMIN].includes(usuarioNegocio.rol);
        if (!canSendEmail) {
            return res.status(403).json({ message: CLIENTE_ERRORS.NO_EMAIL_PERMISSION });
        }

        if (!cliente.email) {
            return res.status(400).json({ message: CLIENTE_ERRORS.CLIENTE_WITHOUT_EMAIL });
        }

        const parsedAttachments = Array.isArray(adjuntos)
            ? adjuntos.map((adjunto, index) => ({
                filename: `adjunto-${index + 1}`,
                path: adjunto.trim(),
            }))
            : [];

        await sendClienteEmail(cliente.email, asuntoValue, mensajeValue, parsedAttachments);

        return res.status(200).json({ message: CLIENTE_MESSAGES.CLIENTE_EMAIL_SENT });
    } catch (error) {
        return res.status(500).json({ message: CLIENTE_ERRORS.SERVER_ERROR });
    }
};
