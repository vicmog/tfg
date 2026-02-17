export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

export const mockRoute = {
  params: { message: "REGISTER_SUCCESS" },
} as any;
