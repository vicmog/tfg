import { Negocio } from "../models/Negocio.js";
import { UsuarioNegocio } from "../models/UsuarioNegocio.js";

export const createNegocio = async (req, res) => {
    const { nombre, CIF } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: "El nombre del negocio es obligatorio" });
    }

    if (!CIF || !CIF.trim()) {
        return res.status(400).json({ message: "El CIF es obligatorio" });
    }

    if (!id_usuario) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    try {
        const existingNegocio = await Negocio.findOne({ where: { CIF: CIF.trim() } });
        if (existingNegocio) {
            return res.status(400).json({ message: "Ya existe un negocio con este CIF" });
        }

        const negocio = await Negocio.create({
            nombre: nombre.trim(),
            CIF: CIF.trim(),
            plantilla: 0
        });

        await UsuarioNegocio.create({
            id_usuario: id_usuario,
            id_negocio: negocio.id_negocio,
            rol: "jefe"
        });

        if (id_usuario !== 1) {
            await UsuarioNegocio.create({
                id_usuario: 1,
                id_negocio: negocio.id_negocio,
                rol: "admin"
            });
        }

        return res.status(201).json({
            message: "Negocio creado correctamente",
            negocio: {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla
            }
        });

    } catch (error) {
        console.error("Error al crear negocio:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const getNegocios = async (req, res) => {
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    try {
        const usuarioNegocios = await UsuarioNegocio.findAll({
            where: { id_usuario }
        });

        if (!usuarioNegocios || usuarioNegocios.length === 0) {
            return res.status(200).json({ negocios: [] });
        }

        const negocioIds = usuarioNegocios.map(un => un.id_negocio);
        const negocios = await Negocio.findAll({
            where: { id_negocio: negocioIds }
        });

        const negociosConRol = negocios.map(negocio => {
            const usuarioNegocio = usuarioNegocios.find(un => un.id_negocio === negocio.id_negocio);
            return {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla,
                rol: usuarioNegocio?.rol || "trabajador"
            };
        });

        return res.status(200).json({ negocios: negociosConRol });

    } catch (error) {
        console.error("Error al obtener negocios:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const updateNegocio = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: "El nombre del negocio es obligatorio" });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!usuarioNegocio || (usuarioNegocio.rol !== "jefe" && usuarioNegocio.rol !== "admin")) {
            return res.status(403).json({ message: "No tienes permisos para editar este negocio" });
        }

        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            return res.status(404).json({ message: "Negocio no encontrado" });
        }

        await negocio.update({ nombre: nombre.trim() });

        return res.status(200).json({
            message: "Negocio actualizado correctamente",
            negocio: {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla
            }
        });

    } catch (error) {
        console.error("Error al actualizar negocio:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const deleteNegocio = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!usuarioNegocio || (usuarioNegocio.rol !== "jefe" && usuarioNegocio.rol !== "admin")) {
            return res.status(403).json({ message: "No tienes permisos para eliminar este negocio" });
        }

        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            return res.status(404).json({ message: "Negocio no encontrado" });
        }

        await UsuarioNegocio.destroy({
            where: { id_negocio: id }
        });

        await negocio.destroy();

        return res.status(200).json({ message: "Negocio eliminado correctamente" });

    } catch (error) {
        console.error("Error al eliminar negocio:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};

export const getNegocioById = async (req, res) => {
    const { id } = req.params;
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    try {
        const usuarioNegocio = await UsuarioNegocio.findOne({
            where: { id_usuario, id_negocio: id }
        });

        if (!usuarioNegocio) {
            return res.status(403).json({ message: "No tienes acceso a este negocio" });
        }

        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            return res.status(404).json({ message: "Negocio no encontrado" });
        }

        return res.status(200).json({
            negocio: {
                id_negocio: negocio.id_negocio,
                nombre: negocio.nombre,
                CIF: negocio.CIF,
                plantilla: negocio.plantilla,
                rol: usuarioNegocio.rol
            }
        });

    } catch (error) {
        console.error("Error al obtener negocio:", error);
        return res.status(500).json({ message: "Error en el servidor" });
    }
};
