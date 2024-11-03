import express, { json } from 'express';
import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const getAwesome = async (req, res) => {
    try {
        const racesRespond = await axios.get('https://lab-2105cf46-fd70-4e4b-8ece-4494323c5240.australiaeast.cloudapp.azure.com:7042/race', { httpsAgent });

        if (racesRespond.status !== 200) {
            return res.status(500).json({
                code: 500,
                result: 'Error fetching races'
            });
        }

        const races = racesRespond.data.result;
        const raceIds = races.map(race => race.id);
        let scoreboard = {};

        for (const raceId of raceIds) {
            const leaderboardRespond = await axios.get(`https://lab-2105cf46-fd70-4e4b-8ece-4494323c5240.australiaeast.cloudapp.azure.com:7042/race/${raceId}/leaderboard`, { httpsAgent });

            if (leaderboardRespond.status !== 200) {
                return res.status(500).json({
                    code: 500,
                    result: 'Error fetching leaderboard'
                });
            }

            const leaderboard = leaderboardRespond.data.result;
            console.log(leaderboard);
            const winner = leaderboard[0];
            const secondPlace = leaderboard[1];

            if (!scoreboard[winner.number]) {
                scoreboard[winner.number] = {
                    name: winner.name,
                    shortName: winner.shortName,
                    score: 0
                };
            }
            scoreboard[winner.number].score += 3;

            if (!scoreboard[secondPlace.number]) {
                scoreboard[secondPlace.number] = {
                    name: secondPlace.name,
                    shortName: secondPlace.shortName,
                    score: 0
                };
            }
            scoreboard[secondPlace.number].score += 1;
        }

        scoreboard = Object.entries(scoreboard)
            .sort(([, a], [, b]) => b.score - a.score)
            .map(([number, driver]) => ({ number, ...driver }));

        res.status(200).json({
            code: 200,
            result: scoreboard
        });
    } catch (error) {
        console.error('Error:', error.message || error);
        res.status(500).json({
            code: 500,
            result: error.message
        });
    }
};

const router = express.Router();
router.get('/', getAwesome);

export default router;
