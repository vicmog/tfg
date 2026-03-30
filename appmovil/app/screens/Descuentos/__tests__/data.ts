export const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
} as any;

export const mockNegocioJefe = {
    id_negocio: 1,
    nombre: "Mi Negocio",
    CIF: "B12345678",
    plantilla: 2,
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
