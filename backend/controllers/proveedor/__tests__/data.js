export const mockUsuarioJefe = { id_usuario: 1, id_negocio: 10, rol: "jefe" };
export const mockUsuarioAdmin = { id_usuario: 3, id_negocio: 10, rol: "admin" };
export const mockUsuarioTrabajador = { id_usuario: 2, id_negocio: 10, rol: "trabajador" };

export const createProveedorReq = {
    body: {
        id_negocio: 10,
        nombre: "Distribuciones Norte",
        cif_nif: "B12345678",
        contacto: "Laura Pérez",
        telefono: "600123123",
        email: "proveedor@mail.com",
        tipo_proveedor: "Material de peluquería",
        direccion: "Calle Mayor 1",
    },
    user: { id_usuario: 1 },
};

export const createProveedorReqAdmin = {
    body: {
        id_negocio: 10,
        nombre: "Cosméticos Pro",
        cif_nif: "A87654321",
        contacto: "Pablo Gómez",
        email: "contacto@cosmeticospro.com",
        tipo_proveedor: "Cosmética",
        direccion: "Avenida Sol 12",
    },
    user: { id_usuario: 3 },
};

export const createProveedorReqSinNombre = {
    body: {
        id_negocio: 10,
        nombre: "   ",
        cif_nif: "B12345678",
        contacto: "Laura Pérez",
        email: "proveedor@mail.com",
        tipo_proveedor: "Material de peluquería",
    },
    user: { id_usuario: 1 },
};

export const createProveedorReqSinCif = {
    body: {
        id_negocio: 10,
        nombre: "Distribuciones Norte",
        cif_nif: "   ",
        contacto: "Laura Pérez",
        email: "proveedor@mail.com",
        tipo_proveedor: "Material de peluquería",
    },
    user: { id_usuario: 1 },
};

export const createProveedorReqSinContacto = {
    body: {
        id_negocio: 10,
        nombre: "Distribuciones Norte",
        cif_nif: "B12345678",
        contacto: "",
        email: "proveedor@mail.com",
        tipo_proveedor: "Material de peluquería",
    },
    user: { id_usuario: 1 },
};

export const createProveedorReqSinCanal = {
    body: {
        id_negocio: 10,
        nombre: "Distribuciones Norte",
        cif_nif: "B12345678",
        contacto: "Laura Pérez",
        email: "",
        telefono: "",
        tipo_proveedor: "Material de peluquería",
    },
    user: { id_usuario: 1 },
};

export const createProveedorReqEmailInvalido = {
    body: {
        id_negocio: 10,
        nombre: "Distribuciones Norte",
        cif_nif: "B12345678",
        contacto: "Laura Pérez",
        email: "email-invalido",
        tipo_proveedor: "Material de peluquería",
    },
    user: { id_usuario: 1 },
};

export const createProveedorReqSinTipo = {
    body: {
        id_negocio: 10,
        nombre: "Distribuciones Norte",
        cif_nif: "B12345678",
        contacto: "Laura Pérez",
        email: "proveedor@mail.com",
        tipo_proveedor: "  ",
    },
    user: { id_usuario: 1 },
};

export const createProveedorReqSinPermiso = {
    body: {
        id_negocio: 10,
        nombre: "Distribuciones Norte",
        cif_nif: "B12345678",
        contacto: "Laura Pérez",
        email: "proveedor@mail.com",
        tipo_proveedor: "Material de peluquería",
    },
    user: { id_usuario: 2 },
};

export const getProveedoresReq = {
    params: { id_negocio: "10" },
    user: { id_usuario: 1 },
};

export const getProveedoresReqSinAuth = {
    params: { id_negocio: "10" },
    user: null,
};

export const getProveedoresReqSinPermiso = {
    params: { id_negocio: "10" },
    user: { id_usuario: 2 },
};

export const deleteProveedorReq = {
    params: { id_proveedor: "7" },
    user: { id_usuario: 1 },
};

export const deleteProveedorReqAdmin = {
    params: { id_proveedor: "7" },
    user: { id_usuario: 3 },
};

export const deleteProveedorReqSinAuth = {
    params: { id_proveedor: "7" },
    user: null,
};

export const deleteProveedorReqSinPermiso = {
    params: { id_proveedor: "7" },
    user: { id_usuario: 2 },
};

export const mockProveedorData = {
    id_proveedor: 7,
    id_negocio: 10,
    nombre: "Distribuciones Norte",
    cif_nif: "B12345678",
    contacto: "Laura Pérez",
    telefono: "600123123",
    email: "proveedor@mail.com",
    tipo_proveedor: "Material de peluquería",
    direccion: "Calle Mayor 1",
};

export const mockProveedores = [
    mockProveedorData,
    {
        id_proveedor: 8,
        id_negocio: 10,
        nombre: "Cosméticos Pro",
        cif_nif: "A87654321",
        contacto: "Pablo Gómez",
        telefono: null,
        email: "contacto@cosmeticospro.com",
        tipo_proveedor: "Cosmética",
        direccion: "Avenida Sol 12",
    },
];

export const mockProveedorEntity = {
    id_proveedor: 7,
    id_negocio: 10,
    destroy: jest.fn(),
};

export const buildRes = () => {
    const jsonMock = jest.fn();
    const res = {
        status: jest.fn(() => ({ json: jsonMock })),
    };

    return { res, jsonMock };
};
