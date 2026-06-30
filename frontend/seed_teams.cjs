const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/v1';
const EVENT_ID = process.argv[2] || 8; // fallback to 8 if not provided

async function seed() {
    try {
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@seal-hms.local',
            password: 'Admin@12345'
        });
        const adminToken = loginRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${adminToken}` } };

        const runId = Date.now().toString().slice(-4);
        for (let i = 1; i <= 7; i++) {
            const teamName = `Team ${i} (${runId})`;
            console.log(`\n--- Creating ${teamName} ---`);

            const members = [];
            for (let j = 0; j < 3; j++) {
                const roleSuffix = j === 0 ? 'leader' : `m${j}`;
                const email = `team${i}_${roleSuffix}_${runId}@gmail.com`;
                
                try {
                    console.log(`Registering ${email}...`);
                    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                        email,
                        password: '123456',
                        role: 'STUDENT',
                        studentCode: `SE${runId}${i}${j}`,
                        firstName: `Student ${roleSuffix.toUpperCase()}`,
                        lastName: `T${i}`
                    });
                    // The API returns the account inside data
                    const accountId = regRes.data.data.id;
                    members.push(accountId);
                    console.log(`Registered successfully with ID: ${accountId}`);
                } catch (err) {
                    console.error(`Failed to register ${email}:`, err.response?.data?.message || err.message);
                }
            }

            if (members.length < 3) {
                console.log(`Skipping ${teamName} because not all members were registered.`);
                continue;
            }

            const leaderId = members[0];
            let teamId;
            try {
                console.log(`Creating ${teamName}...`);
                const teamRes = await axios.post(`${BASE_URL}/events/${EVENT_ID}/teams`, {
                    name: teamName,
                    leaderAccountId: leaderId
                }, config);
                teamId = teamRes.data.data.id;
                console.log(`Created team with ID: ${teamId}`);
            } catch (err) {
                console.error(`Failed to create team:`, err.response?.data?.message || err.message);
                continue;
            }

            for (let j = 1; j < 3; j++) {
                const memberId = members[j];
                try {
                    console.log(`Inviting member ID ${memberId}...`);
                    await axios.post(`${BASE_URL}/teams/${teamId}/members`, {
                        accountId: memberId
                    }, config);
                    
                    console.log(`Accepting invite for member ID ${memberId}...`);
                    await axios.patch(`${BASE_URL}/teams/${teamId}/members/${memberId}/accept`, {}, config);
                } catch (err) {
                    console.error(`Failed to add member ${memberId}:`, err.response?.data?.message || err.message);
                }
            }

            try {
                console.log(`Approving ${teamName}...`);
                await axios.patch(`${BASE_URL}/teams/${teamId}/status`, {
                    status: 'APPROVED'
                }, config);
                console.log(`${teamName} approved!`);
            } catch (err) {
                console.error(`Failed to approve team:`, err.response?.data?.message || err.message);
            }
        }
        
        console.log('\nAll done!');
    } catch (err) {
        console.error('Fatal error:', err.response?.data || err.message);
    }
}

seed();
