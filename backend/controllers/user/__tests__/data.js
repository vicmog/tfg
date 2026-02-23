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

export const buildReq = () => ({
  params: {},
  body: {},
  query: {},
});

export const mockUserWithUpdate = ({
  email = "old@test.com",
  nombre = "old",
  contrasena = "hashedpass",
} = {}) => ({
  id_usuario: 1,
  nombre_usuario: "user",
  nombre,
  dni: "123",
  email,
  numero_telefono: "600",
  contrasena,
  update: jest.fn(),
});

export const updatedUserPayload = {
  id_usuario: 1,
  nombre_usuario: "user",
  nombre: "NuevoNombre",
  dni: "123",
  email: "new@test.com",
  numero_telefono: "600",
};

export const emailTakenUser = {
  ...mockUserWithUpdate(),
  email: "old@test.com",
};

export const searchUsersResult = [
  { id_usuario: 1, nombre_usuario: "ana1", nombre: "Ana" },
  { id_usuario: 2, nombre_usuario: "anabel", nombre: "Anabel" },
];
