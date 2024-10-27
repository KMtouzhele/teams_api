export const isValidCar = (req, res, next) => {
    const { suitability: { street, race }, reliability } = req.body;
    if (!race || !street || !reliability) {
        return res.status(400).json({
            message: 'All fields are required: raceSuit, streetSuit, reliability'
        });
    }
    const numberRace = parseInt(race, 10);
    const numberStreet = parseInt(street, 10);
    const numberReliability = parseInt(reliability, 10);
    if (isNaN(numberRace) || isNaN(numberStreet) || isNaN(numberReliability)) {
        return res.status(400).json({
            code: 400,
            result: 'All fields must be numbers: raceSuit, streetSuit, reliability'
        });
    }
    if (numberRace + numberStreet !== 100) {
        return res.status(400).json({
            code: 400,
            result: 'Invalid data: raceSuit + streetSuit must equal 100'
        });
    }
    next();
};
