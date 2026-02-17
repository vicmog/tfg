export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

export const mockNegocio = {
  id_negocio: 2,
  nombre: "Mi Negocio",
  CIF: "B12345678",
  plantilla: 0,
  rol: "jefe",
};

export const mockRoute = {
  params: { negocio: mockNegocio },
} as any;
