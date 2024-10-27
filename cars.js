import express, { json } from 'express';
import dbconn from './dbconn.js';
import { apiKeyMiddleware } from './apiKeyMiddleware.js';
import { isValidCar } from './isValidCar.js';

const fetchDriverBrief = (driverNumber) => {
    return new Promise((resolve, reject) => {
        dbconn.query('SELECT * FROM drivers WHERE number = ?', [driverNumber], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows.length === 0) {
                resolve(null);
            } else {
                const driver = {
                    name: rows[0].name,
                    uri: `https://lab-95a11ac6-8103-422e-af7e-4a8532f40144.australiaeast.cloudapp.azure.com:7065/driver/${driverNumber}`,
                };
                resolve(driver);
            }
        });
    });
};

const fetchDriver = (driverNumber) => {
    return new Promise((resolve, reject) => {
        dbconn.query('SELECT * FROM drivers WHERE number = ?', [driverNumber], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows.length === 0) {
                resolve(null);
            } else {
                const driver = {
                    number: rows[0].number,
                    shortName: rows[0].shortName,
                    name: rows[0].name,
                    skill: {
                        race: rows[0].race,
                        street: rows[0].street
                    },
                };
                resolve(driver);
            }
        });
    });
};

const fetchCar = (carId) => {
    return new Promise((resolve, reject) => {
        dbconn.query('SELECT * FROM cars WHERE id = ?', [carId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows.length === 0) {
                resolve(null);
            } else {
                const car = {
                    id: rows[0].id,
                    driverNumber: rows[0].number,
                    suitability: {
                        race: rows[0].race,
                        street: rows[0].street
                    },
                    reliability: rows[0].reliability
                };
                resolve(car);
            };
        });
    });
};

const getCars = async (req, res) => {
    dbconn.query('SELECT * FROM cars', async (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                result: err
            });
        }
        try {
            const carsWithDrivers = await Promise.all(
                rows.map(async (car) => {
                    const driver = await fetchDriverBrief(car.number);
                    return {
                        id: car.id,
                        driver: driver || { name: "N/A", uri: "N/A" },
                        suitability: {
                            race: car.race,
                            street: car.street,
                        },
                        reliability: car.reliability,
                    };
                })
            );
            res.status(200).json({
                code: 200,
                result: carsWithDrivers
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                result: error
            });
        }
    });
};

const getCar = (req, res) => {
    const carId = req.params.id;
    dbconn.query('SELECT * FROM cars WHERE id = ?', [carId], async (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                result: err
            });
        };
        try {
            if (rows.length === 0) {
                return res.status(404).json({
                    code: 404,
                    result: 'Car Not found'
                });
            }
            const car = rows[0];
            if (!car.number) {
                return res.status(404).json({
                    code: 404,
                    result: "Driver not assigned"
                });
            }
            const driver = await fetchDriver(car.number);
            const carWithDriver = {
                id: car.id,
                driver: {
                    name: driver.name,
                    uri: driver.uri
                },
                suitability: {
                    race: car.race,
                    street: car.street,
                },
                reliability: car.reliability,
            };
            return res.status(200).json({
                code: 200,
                result: carWithDriver
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                result: error
            });
        }
    });
};

const getDriverOfCar = (req, res) => {
    const carId = req.params.id;
    dbconn.query('SELECT number FROM cars WHERE id = ?', [carId], async (err, rows) => {
        if (err) {
            return res.status(500).json({
                code: 500,
                result: err
            });
        }
        if (rows.length === 0) {
            return res.status(404).json({
                code: 404,
                result: 'Car Not found'
            });
        }
        const driverNumber = rows[0].number;
        if (!driverNumber) {
            return res.status(404).json({
                code: 404,
                result: "Driver not assigned"
            });
        }
        try {
            const driver = await fetchDriver(driverNumber);
            if (driver) {
                return res.json({
                    code: 200,
                    result: driver
                });
            }
        } catch (error) {
            res.status(500).json({
                code: 500,
                result: error
            });
        }
    });
};

const addCar = (req, res) => {
    const { suitability: { street, race }, reliability } = req.body;
    const streetInt = parseInt(street, 10);
    const raceInt = parseInt(race, 10);
    const reliabilityInt = parseInt(reliability, 10);
    dbconn.query(
        'INSERT INTO cars (race, street, reliability) VALUES (?, ?, ?)',
        [raceInt, streetInt, reliabilityInt], (err, result) => {
            if (err) {
                res.status(500).json({
                    code: 500,
                    result: err
                });
            }
            res.status(200).json({
                code: 200,
                result: 'Car added successfully'
            });
        }
    );
};

const assignDriverToCar = async (req, res) => {
    const { number, shortName, name, skill: { race, street } } = req.body;
    const carId = req.params.id;
    if (!number || !shortName || !name || !race || !street) {
        return res.status(400).json({
            code: 400,
            result: 'Request body invalid'
        });
    }
    const numberInt = parseInt(number, 10);
    try {
        const driverExists = await new Promise((resolve, reject) => {
            dbconn.query(
                'SELECT * FROM drivers WHERE number = ?',
                [numberInt],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(rows.length > 0);
                });
        });

        const driverAssigned = await new Promise((resolve, reject) => {
            dbconn.query(
                'SELECT * FROM cars WHERE number = ?',
                [numberInt],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(rows.length > 0);
                });
        });
        if (!driverExists) {
            return res.status(404).json({
                code: 404,
                result: 'Driver Not found'
            });
        }
        if (driverAssigned) {
            return res.status(400).json({
                code: 400,
                result: 'Driver already assigned to a car'
            });
        }
        dbconn.query(
            'UPDATE cars SET number = ? WHERE id = ?',
            [numberInt, carId],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        code: 500,
                        result: err
                    });
                }
                res.status(200).json({
                    code: 200,
                    result: 'Driver assigned to car successfully'
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            code: 500,
            result: error
        });
    }
};

const removeDriverFromCar = (req, res) => {
    const carId = req.params.id;
    dbconn.query(
        'UPDATE cars SET number = NULL WHERE id = ?',
        [carId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    code: 500,
                    result: err
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    code: 404,
                    result: 'Car Not found'
                });
            }
            res.status(200).json({
                code: 200,
                result: 'Driver removed from car successfully'
            });
        }
    );
};

const updateCar = (req, res) => {
    const { suitability: { street, race }, reliability } = req.body;
    const carId = req.params.id;
    const numStreet = parseInt(street, 10);
    const numberRace = parseInt(race, 10);
    const numberReliability = parseInt(reliability, 10);
    dbconn.query(
        'UPDATE cars SET race = ?, street = ?, reliability = ? WHERE id = ?',
        [numberRace, numStreet, numberReliability, carId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    code: 500,
                    result: err
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    code: 404,
                    result: 'Car Not found'
                });
            }
            res.status(200).json({
                code: 200,
                result: 'Car updated successfully'
            });
        }
    );
};

const deleteCar = (req, res) => {
    const carId = req.params.id;
    dbconn.query(
        'DELETE FROM cars WHERE id = ?',
        [carId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    code: 500,
                    result: err
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    code: 404,
                    result: 'Car Not found'
                });
            }
            res.status(200).json({
                code: 200,
                result: 'Car deleted successfully'
            });
        }
    );
};

const getLapResult = async (req, res) => {
    const carId = req.params.id;
    const { type, baseLapTime } = req.query;
    console.log("Request : ", req.query);
    const car = await fetchCar(carId);
    if (!car) {
        return res.status(404).json({ code: 404, result: 'Car Not found' });
    }
    const reliability = car.reliability;
    const driverNumber = car.driverNumber;
    if (!driverNumber) {
        return res.status(418).json({ code: 418, result: 'I am a Teapot?' });
    }
    if (!type || !baseLapTime) {
        return res.status(400).json({ code: 400, result: 'All fields are required: type, baseLapTime' });
    }
    if (type !== 'street' && type !== 'race') {
        return res.status(400).json({ code: 400, result: 'Invalid trackType: must be either "street" or "race" ' });
    }
    const random = type === 'street'
        ? Math.floor(Math.random() * (reliability + 10))
        : Math.floor(Math.random() * (reliability + 5));

    if (random >= reliability) {
        const lap = {
            time: 0,
            randomness: random,
            crashed: true
        };
        return res.status(200).json({ code: 200, result: lap });
    }
    const suitability = type === 'street' ? car.suitability.street : car.suitability.race;
    const driver = await fetchDriver(driverNumber);
    if (!driver) {
        return res.status(404).json({ code: 404, result: 'Driver Not found' });
    }
    const raceSkill = driver.skill.race;
    const streetSkill = driver.skill.street;
    const driverSkill = type === 'street' ? streetSkill : raceSkill;
    const speed = (suitability + driverSkill + (100 - reliability)) / 3;
    const time = baseLapTime + (10 * (speed / 100));
    const lap = {
        time: time,
        randomness: random,
        crashed: false
    };
    res.status(200).json({ code: 200, result: lap });
};

const router = express.Router();
router.get('/', getCars);
router.get('/:id', getCar);
router.get('/:id/driver', getDriverOfCar);
router.post('/', apiKeyMiddleware, isValidCar, addCar);
router.put('/:id/driver', apiKeyMiddleware, assignDriverToCar);
router.delete('/:id/driver', apiKeyMiddleware, removeDriverFromCar);
router.put('/:id', apiKeyMiddleware, isValidCar, updateCar);
router.delete('/:id', apiKeyMiddleware, deleteCar);
router.get('/:id/lap', getLapResult);

export default router;
