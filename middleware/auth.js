const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
            req.userRole = decoded.role;
            req.company = decoded.company;

            if (roles.length && !roles.includes(req.userRole)) {
                return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para realizar esta ação.' });
            }

            next();
        } catch (error) {
            res.status(400).json({ message: 'Token inválido' });
        }
    };
};

module.exports = auth;
