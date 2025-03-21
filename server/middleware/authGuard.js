const jwt = require ("jsonwebtoken");

const authGuard = (req, res, next) => {
    
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Token not found"
        });
    }

    const token = authHeader.split(" ")[1];

    if(!token || token === "") {
        return res.status(401).json({
            success: false,
            message: "Token not found"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();


    } catch (error) {
        console.log(error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: error
        });
    }
};

module.exports = authGuard;