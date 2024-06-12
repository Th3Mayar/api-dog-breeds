const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    const validApiKey = process.env.API_KEY;
    if (apiKey === validApiKey) {
        next();
    }
    else {
        res.status(401).json({ message: "Unauthorized" });
    }
};
export default apiKeyAuth;
