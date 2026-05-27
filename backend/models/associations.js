import { ProductoServicio } from "./ProductoServicio.js";
import { Producto } from "./Producto.js";
import { Servicio } from "./Servicio.js";
import { ProductoServicioVenta } from "./ProductoServicioVenta.js";
import { Venta } from "./Venta.js";
import { Proveedor } from "./Proveedor.js";
import { Recurso } from "./Recurso.js";

ProductoServicio.hasOne(Producto, {
    foreignKey: "id_ps",
    sourceKey: "id_ps",
    as: "producto",
    onDelete: "CASCADE",
});

Producto.belongsTo(ProductoServicio, {
    foreignKey: "id_ps",
    targetKey: "id_ps",
    as: "base",
});

ProductoServicio.hasOne(Servicio, {
    foreignKey: "id_ps",
    sourceKey: "id_ps",
    as: "servicio",
    onDelete: "CASCADE",
});

Servicio.belongsTo(ProductoServicio, {
    foreignKey: "id_ps",
    targetKey: "id_ps",
    as: "base",
});

Venta.hasMany(ProductoServicioVenta, {
    foreignKey: "id_venta",
    sourceKey: "id_venta",
    as: "detalles",
    onDelete: "CASCADE",
});

ProductoServicioVenta.belongsTo(Venta, {
    foreignKey: "id_venta",
    targetKey: "id_venta",
    as: "venta",
});

ProductoServicioVenta.belongsTo(ProductoServicio, {
    foreignKey: "id_ps",
    targetKey: "id_ps",
    as: "productoServicio",
});

Proveedor.hasMany(Producto, {
    foreignKey: "id_proveedor",
    sourceKey: "id_proveedor",
    as: "productos",
    onDelete: "CASCADE",
});

Producto.belongsTo(Proveedor, {
    foreignKey: "id_proveedor",
    targetKey: "id_proveedor",
    as: "proveedor",
});

Recurso.hasMany(Servicio, {
    foreignKey: "id_recurso_favorito",
    sourceKey: "id_recurso",
    as: "serviciosFavoritos",
    onDelete: "SET NULL",
});

Servicio.belongsTo(Recurso, {
    foreignKey: "id_recurso_favorito",
    targetKey: "id_recurso",
    as: "recursoFavorito",
});

export const associations = true;