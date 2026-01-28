import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResetPassword from '../ResetPassword';
import { Alert } from 'react-native';

global.fetch = jest.fn();

const mockNavigation = { navigate: jest.fn() } as any;
const mockRoute = {
    params: { message: "REGISTER_SUCCESS" },
} as any;
describe('ResetPassword screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renderiza y envía petición correctamente, navega a Login', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'ok' }) });

        const { getByPlaceholderText, getByText } = render(<ResetPassword navigation={mockNavigation} route={mockRoute} /> as any);

        fireEvent.changeText(getByPlaceholderText('Nombre de usuario'), 'usuario1');
        fireEvent.press(getByText('Enviar nueva contraseña'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/v1/api/auth/reset-password', expect.any(Object));
            expect(mockNavigation.navigate).toHaveBeenCalledWith('Login',{"message": "PASSWORD_RESET_SUCCESS"});
        });
    });
});
