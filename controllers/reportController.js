const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.exportReport = async (req, res) => {
    try {
        const { type, period } = req.query;
        let data;

        // Definir a data de início com base no período
        let startDate = new Date();
        switch (period) {
            case 'weekly':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'yearly':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                return res.status(400).json({ message: 'Período inválido' });
        }

        // Buscar dados com base no tipo de relatório
        switch (type) {
            case 'sales':
                data = await Sale.find({ 
                    createdAt: { $gte: startDate },
                    userId: req.userId
                })
                .select('items.product items.quantity items.price totalValue createdAt')
                .populate('items.product', 'name')
                .limit(1000)
                .lean();
                break;
            case 'inventory':
                data = await Product.find({ userId: req.userId });
                break;
            case 'financial':
                // Implemente a lógica para relatório financeiro
                break;
            default:
                return res.status(400).json({ message: 'Tipo de relatório inválido' });
        }

        // Converta para CSV de forma mais eficiente
        const csv = await convertToCSVStream(data);

        // Enviar CSV como resposta
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_${period}_report.csv`);
        csv.pipe(res);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar relatório' });
    }
};

// Função auxiliar para converter dados para CSV usando streams
function convertToCSVStream(data) {
    const { Readable } = require('stream');
    const { stringify } = require('csv-stringify');

    const readableStream = new Readable({
        read() {
            this.push(JSON.stringify(data));
            this.push(null);
        }
    });

    return readableStream.pipe(stringify({
        header: true,
        columns: Object.keys(data[0])
    }));
}
