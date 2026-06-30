const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/v1';
const EVENT_ID = process.argv[2] || 9;

async function seed() {
    try {
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@seal-hms.local',
            password: 'Admin@12345'
        });
        const adminToken = loginRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${adminToken}` } };

        let studentCounter = 1;
        for (let i = 1; i <= 7; i++) {
            const teamName = `Team Hoang ${i}`;
            console.log(`\n--- Creating ${teamName} ---`);

            const members = [];
            for (let j = 0; j < 3; j++) {
                const email = `hoang${studentCounter}@gmail.com`;
                studentCounter++;
                
                try {
                    console.log(`Logging in ${email} to get ID...`);
                    const res = await axios.post(`${BASE_URL}/auth/login`, {
                        email,
                        password: '123456'
                    });
                    
                    // The backend doesn't always return accountId in login. 
                    // Let's use the accounts API to find the ID instead.
                    const accountsRes = await axios.get(`${BASE_URL}/accounts?status=ACTIVE`, config);
                    let account = accountsRes.data.data.find(a => a.email === email);
                    if (!account) {
                        const pendingRes = await axios.get(`${BASE_URL}/accounts?status=PENDING`, config);
                        account = pendingRes.data.data.find(a => a.email === email);
                    }
                    
                    if (account) {
                        members.push(account.id);
                        console.log(`Found ID: ${account.id}`);
                    } else {
                        console.log(`Could not find account ID for ${email}`);
                    }
                } catch (err) {
                    console.error(`Failed to login/fetch ${email}:`, err.response?.data?.message || err.message);
                }
            }

            if (members.length < 3) {
                console.log(`Skipping ${teamName} because not all members were found.`);
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
        }
        
        console.log('\nAll done!');
    } catch (err) {
        console.error('Fatal error:', err.response?.data || err.message);
    }
}

seed();
