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
                }).populate('items.product', 'name');
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

        // Converter dados para CSV
        const csv = convertToCSV(data);

        // Enviar CSV como resposta
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_${period}_report.csv`);
        res.status(200).send(csv);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Função auxiliar para converter dados para CSV
function convertToCSV(data) {
    // Implemente a lógica de conversão para CSV aqui
    // Esta é uma implementação básica e deve ser adaptada para seus dados específicos
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    return [header, ...rows].join('\n');
}
