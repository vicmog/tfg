export const buildRes = () => {
  const jsonMock = jest.fn();
  const res = {
    status: jest.fn(() => ({ json: jsonMock })),
  };

  return { res, jsonMock };
};

export const defaultNegocioPayload = {
  nombre: "Mi Negocio",
  CIF: "B12345678",
};
