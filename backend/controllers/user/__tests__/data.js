export const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

export const baseUser = {
  id_usuario: 1,
  nombre_usuario: "testuser",
  nombre: "Test",
  dni: "12345678",
  email: "test@test.com",
  numero_telefono: "600123456",
};
