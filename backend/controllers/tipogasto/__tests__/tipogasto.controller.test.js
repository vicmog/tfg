import { deleteTipoGasto } from "../tipogastoController.js";
import { Gasto } from "../../../models/Gasto.js";
import { TipoGasto } from "../../../models/TipoGasto.js";
import { UsuarioNegocio } from "../../../models/UsuarioNegocio.js";

describe("TipoGastoController Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("elimina primero los gastos y luego el tipo de gasto", async () => {
        const tipoGastoMock = {
            id_tipo_gasto: 12,
            id_negocio: 3,
            destroy: jest.fn().mockResolvedValue(true),
        };

        (TipoGasto.findByPk).mockResolvedValue(tipoGastoMock);
        (UsuarioNegocio.findOne).mockResolvedValue({ rol: "jefe" });
        (Gasto.destroy).mockResolvedValue(2);

        const statusMock = jest.fn().mockReturnThis();
        const jsonMock = jest.fn();

        const req = {
            params: { id_tipo_gasto: "12" },
            user: { id_usuario: 7 },
        };

        const res = {
            status: statusMock,
            json: jsonMock,
        };

        await deleteTipoGasto(req, res);

        expect(TipoGasto.findByPk).toHaveBeenCalledWith(12);
        expect(Gasto.destroy).toHaveBeenCalledWith({
            where: { id_tipo_gasto: 12 },
        });
        expect(tipoGastoMock.destroy).toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Tipo de gasto eliminado correctamente",
        });
    });
});

jest.mock("../../../models/Gasto.js");
jest.mock("../../../models/TipoGasto.js");
jest.mock("../../../models/UsuarioNegocio.js");
