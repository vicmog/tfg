import { Empleado } from "../../models/Empleado.js";
import { UsuarioNegocio } from "../../models/UsuarioNegocio.js";
import {
    EMAIL_REGEX,
    EMPLEADO_ERRORS,
    EMPLEADO_MESSAGES,
    EMPLEADO_ROLES,
} from "./constants.js";

const canManageEmpleados = (rol) => [EMPLEADO_ROLES.ADMIN, EMPLEADO_ROLES.JEFE].includes(rol);

const serializeEmpleado = (empleado) => ({
    id_empleado: empleado.id_empleado,
    id_negocio: empleado.id_negocio,
    nombre: empleado.nombre,
    apellido1: empleado.apellido1,
    apellido2: empleado.apellido2,
    numero_telefono: empleado.numero_telefono,
    email: empleado.email,
});

export const createEmpleado = async (req, res) => {
    const {
        id_negocio,
        nombre,
        apellido1,
        apellido2,
        numero_telefono,
        email,
    } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: EMPLEADO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: EMPLEADO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: EMPLEADO_ERRORS.NOMBRE_REQUIRED });
    }

    if (!apellido1 || !apellido1.trim()) {
        return res.status(400).json({ message: EMPLEADO_ERRORS.APELLIDO1_REQUIRED });
    }

    const emailValue = typeof email === "string" ? email.trim() : "";
    const telefonoValue = typeof numero_telefono === "string" ? numero_telefono.trim() : "";

    if (!emailValue && !telefonoValue) {
        return res.status(400).json({ message: EMPLEADO_ERRORS.CONTACT_REQUIRED });
    }

    if (emailValue && !EMAIL_REGEX.test(emailValue)) {
        return res.status(400).json({ message: EMPLEADO_ERRORS.INVALID_EMAIL });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: EMPLEADO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageEmpleados(usuarioNegocio.rol)) {
            return res.status(403).json({ message: EMPLEADO_ERRORS.NO_CREATE_PERMISSION });
        }

        const empleado = await Empleado.create({
            id_negocio,
            nombre: nombre.trim(),
            apellido1: apellido1.trim(),
            apellido2: typeof apellido2 === "string" ? apellido2.trim() || null : null,
            numero_telefono: telefonoValue || null,
            email: emailValue || null,
        });

        return res.status(201).json({
            message: EMPLEADO_MESSAGES.EMPLEADO_CREATED,
            empleado: serializeEmpleado(empleado),
        });
    } catch (error) {
        return res.status(500).json({ message: EMPLEADO_ERRORS.SERVER_ERROR });
    }
};

export const getEmpleadosByNegocio = async (req, res) => {
    const { id_negocio } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: EMPLEADO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    if (!id_negocio) {
        return res.status(400).json({ message: EMPLEADO_ERRORS.NEGOCIO_ID_REQUIRED });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: EMPLEADO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageEmpleados(usuarioNegocio.rol)) {
            return res.status(403).json({ message: EMPLEADO_ERRORS.NO_CREATE_PERMISSION });
        }

        const empleados = await Empleado.findAll({
            where: { id_negocio },
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({ empleados: empleados.map(serializeEmpleado) });
    } catch (error) {
        return res.status(500).json({ message: EMPLEADO_ERRORS.SERVER_ERROR });
    }
};

export const deleteEmpleado = async (req, res) => {
    const { id_empleado } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: EMPLEADO_ERRORS.USER_NOT_AUTHENTICATED });
    }

    try {
        const empleado = await Empleado.findByPk(id_empleado);

        if (!empleado) {
            return res.status(404).json({ message: EMPLEADO_ERRORS.EMPLEADO_NOT_FOUND });
        }

        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: empleado.id_negocio },
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: EMPLEADO_ERRORS.NO_ACCESS_TO_NEGOCIO });
        }

        if (!canManageEmpleados(usuarioNegocio.rol)) {
            return res.status(403).json({ message: EMPLEADO_ERRORS.NO_CREATE_PERMISSION });
        }

        await empleado.destroy();

        return res.status(200).json({ message: EMPLEADO_MESSAGES.EMPLEADO_DELETED });
    } catch (error) {
        return res.status(500).json({ message: EMPLEADO_ERRORS.SERVER_ERROR });
    }
};
