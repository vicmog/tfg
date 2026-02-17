import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResetPassword from '../ResetPassword';
import { API_ROUTES } from '@/app/constants/apiRoutes';
import { mockNavigation, mockRoute } from './data';

global.fetch = jest.fn();
describe('ResetPassword screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renderiza y envía petición correctamente, navega a Login', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'ok' }) });

        const { getByPlaceholderText, getByText } = render(<ResetPassword navigation={mockNavigation} route={mockRoute} /> as any);

        fireEvent.changeText(getByPlaceholderText('Nombre de usuario'), 'usuario1');
        fireEvent.press(getByText('Enviar nueva contraseña'));

        await waitFor(() => expect(getByText('Si')).toBeTruthy());
        fireEvent.press(getByText('Si'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(API_ROUTES.authResetPassword, expect.any(Object));
            expect(mockNavigation.navigate).toHaveBeenCalledWith('Login', { message: 'PASSWORD_RESET_SUCCESS' });
        });
    }, 15000);
});
