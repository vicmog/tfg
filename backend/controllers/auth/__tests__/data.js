export const buildRes = () => {
  const jsonMock = jest.fn();
  const res = {
    status: jest.fn(() => ({ json: jsonMock })),
  };

  return { res, jsonMock };
};

export const registerBody = {
  nombre_usuario: "testuser",
  nombre: "Test User",
  dni: "12345678X",
  email: "test@test.com",
  contrasena: "123456",
  consentimiento: true,
};
