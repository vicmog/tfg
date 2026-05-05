export const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
} as any;

export const mockNegocio = {
    id_negocio: 3,
    nombre: "Negocio Demo",
    CIF: "B12345678",
    id_plantilla: null,
    rol: "jefe",
};

export const mockTipoGasto = {
    id_tipo_gasto: 12,
    id_negocio: 3,
    nombre_tipo: "Luz",
};

export const mockGastosRoute = {
    params: { negocio: mockNegocio },
} as any;

export const mockDetailRoute = {
    params: { negocio: mockNegocio, tipoGasto: mockTipoGasto },
} as any;