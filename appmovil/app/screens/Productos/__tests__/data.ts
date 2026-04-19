export const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
} as any;

export const mockNegocioJefe = {
    id_negocio: 1,
    nombre: "Mi Negocio",
    CIF: "B12345678",
    id_plantilla: 2,
    rol: "jefe",
};

export const mockNegocioTrabajador = {
    ...mockNegocioJefe,
    rol: "trabajador",
};

export const mockRoute = {
    params: { negocio: mockNegocioJefe },
} as any;

export const mockRouteTrabajador = {
    params: { negocio: mockNegocioTrabajador },
} as any;

export const mockProducto = {
    id_producto: 5,
    id_proveedor: 7,
    nombre: "Champu",
    referencia: "CH-001",
    categoria: "Cosmetica",
    descripcion: "Uso diario",
    precio_compra: 5,
    precio_venta: 10,
    stock: 8,
    stock_minimo: 1,
    proveedor_nombre: "Proveedor Norte",
};

export const mockEditarRoute = {
    params: {
        negocio: mockNegocioJefe,
        producto: mockProducto,
    },
} as any;

export const mockEditarRouteTrabajador = {
    params: {
        negocio: mockNegocioTrabajador,
        producto: mockProducto,
    },
} as any;
