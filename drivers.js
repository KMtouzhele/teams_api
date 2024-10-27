import express from 'express';
import dbconn from './dbconn.js';
import { apiKeyMiddleware } from './apiKeyMiddleware.js';

const getDrivers = (req, res) => {
    dbconn.query('SELECT * FROM drivers', (err, rows) => {
        if (err) {
            return res.json({
                code: 500,
                result: err
            });
        }
        const drivers = rows.map(driver => ({
            number: driver.number,
            shortName: driver.shortName,
            name: driver.name,
            skill: {
                race: driver.race,
                street: driver.street
            }
        }));

        res.status(200).json({
            code: 200,
            result: drivers
        });
    });
}

const getDriver = (req, res) => {
    dbconn.query('SELECT * FROM drivers WHERE number = ?', [req.params.number], (err, rows) => {
        if (err) {
            res.json({
                code: 500,
                result: err
            });
        }

        if (rows.length == 0) {
            res.json({
                code: 404,
                result: 'Driver not found'
            });
            return;
        }
        const formattedRow = {
            number: rows[0].number,
            shortName: rows[0].shortName,
            name: rows[0].name,
            skill: {
                race: rows[0].race,
                street: rows[0].street
            }
        };
        res.json({
            code: 200,
            result: formattedRow
        });
    });
}

const addDriver = (req, res) => {
    const { name, number, shortName, skill: { street, race } } = req.body;
    if (!number || !shortName || !name || !race || !street) {
        return res.json({
            code: 400,
            result: 'All fields are required: number, shortName, name, raceSkill, streetSkill'
        });
    }
    const numStreet = parseInt(street, 10);
    const numRace = parseInt(race, 10);
    const numberInt = parseInt(number, 10);
    if (numStreet + numRace != 100) {
        return res.json({
            code: 400,
            result: 'Invalid data: race + street must equal 100'
        });
    };

    dbconn.query(
        'INSERT INTO drivers (number, shortName, name, race, street) VALUES (?, ?, ?, ?, ?)',
        [numberInt, shortName, name, numRace, numStreet],
        (err, result) => {
            if (err) {
                return res.json({
                    code: 500,
                    result: err
                });
            }
            res.json({
                code: 200,
                result: 'Driver added successfully'
            });
        }
    );
};

const updateDriver = (req, res) => {
    const { name, number, shortName, skill: { street, race } } = req.body;
    const driverNumber = req.params.number;
    if (!shortName || !name || !race || !street || !number) {
        return res.json({
            code: 400,
            result: 'All fields are required'
        });
    }
    const streetInt = parseInt(street, 10);
    const raceInt = parseInt(race, 10);
    const numberInt = parseInt(number, 10);

    if (raceInt + streetInt != 100) {
        return res.json({
            code: 400,
            result: 'Invalid data: raceSkill + streetSkill must equal 100'
        });
    }

    dbconn.query(
        'UPDATE drivers SET number = ?, shortName = ?, name = ?, race = ?, street = ? WHERE number = ?',
        [number, shortName, name, raceInt, streetInt, driverNumber],
        (err, result) => {
            if (err) {
                return res.json({
                    code: 500,
                    result: err
                });
            }
            if (result.affectedRows === 0) {
                return res.json({
                    code: 400,
                    message: 'Driver Not found'
                });
            }
            res.json({
                code: 200,
                result: 'Driver updated successfully'
            });
        }
    );
};

const deleteDriver = (req, res) => {
    const number = req.params.number;
    dbconn.query('DELETE FROM drivers WHERE number = ?', [number], (err, result) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                result: err
            });
        }
        if (result.affectedRows === 0) {
            return res.json({
                code: 400,
                result: 'Driver Not found'
            });
        }
        res.json({
            code: 200,
            result: 'Driver deleted successfully'
        });
    });
}

const router = express.Router();
router.get('/', getDrivers);
router.get('/:number', getDriver);
router.post('/', apiKeyMiddleware, addDriver);
router.put('/:number', apiKeyMiddleware, updateDriver);
router.delete('/:number', apiKeyMiddleware, deleteDriver);

export default router;