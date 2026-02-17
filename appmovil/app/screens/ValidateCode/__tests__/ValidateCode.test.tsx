import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ValidateCode from '../ValidateCode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockNavigation } from './data';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
}));

global.fetch = jest.fn();

const mockSetIsAuth = jest.fn();

describe('ValidateCode screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('valida correctamente y guarda token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id_usuario: 5, token: 'tok-123' }),
    });

    const { getByPlaceholderText, getByText } = render(
      // @ts-ignore
      <ValidateCode navigation={mockNavigation} route={{ params: { id_usuario: 5 } }} setIsAuth={mockSetIsAuth} />
    );

    fireEvent.changeText(getByPlaceholderText('Código de validación'), '999999');
    fireEvent.press(getByText('Validar'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'tok-123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('id_usuario', '5');
      expect(mockSetIsAuth).toHaveBeenCalledWith(true);
    });
  });

  it('muestra error si código inválido', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Código inválido' }),
    });

    const { getByPlaceholderText, getByText, findByText } = render(
      // @ts-ignore
      <ValidateCode navigation={mockNavigation} route={{ params: { id_usuario: 6 } }} setIsAuth={mockSetIsAuth} />
    );

    fireEvent.changeText(getByPlaceholderText('Código de validación'), '000000');
    fireEvent.press(getByText('Validar'));

    await waitFor(async () => {
      expect(await findByText('Código inválido')).toBeTruthy();
    });
  });
});
