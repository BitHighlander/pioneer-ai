import axios from 'axios';
import qs from 'qs';

const bearerToken = process.env['TWITTER_BEARER_TOKEN'];
if (!bearerToken) throw new Error('Missing bearerToken');

const baseURL = 'https://api.twitter.com/2/';

const twitterClient = axios.create({
    baseURL,
    headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-type': 'application/json',
    },
});

async function setupRules() {
    let response = await twitterClient.get('tweets/search/stream/rules');

    const existingRules = response.data.data;

    if (existingRules && existingRules.length > 0) {
        const ids = existingRules.map((rule) => rule.id);
        await twitterClient.post('tweets/search/stream/rules', {
            delete: { ids },
        });
    }

    const hashtag = 'nftrio';
    await twitterClient.post('tweets/search/stream/rules', {
        add: [{ value: `#${hashtag}`, tag: hashtag }],
    });
}

setupRules()
    .then(() => {
        twitterClient.get('tweets/search/stream', {
            params: {
                'tweet.fields': 'created_at',
            },
            paramsSerializer: params => qs.stringify(params),
            responseType: 'stream',
        })
            .then(response => {
                response.data.on('data', (data) => {
                    if (data) {
                        console.log('New tweet: ', JSON.parse(data));
                    }
                });

                response.data.on('error', (error) => {
                    console.error('Stream error: ', error);
                });
            });
    })
    .catch(console.error);

// const stream = this.twitterClient.v2.stream('tweets/search/stream', { 'tweet.fields': 'created_at' });
//
// stream.on('data', (data) => {
//     if (data.data) {
//         callback(data.data);
//     }
// });
//
// stream.on('error', (error) => {
//     console.error('Stream error: ', error);
// });
//
// async function getUserId(username: string): Promise<string> {
//     // @ts-ignore
//     const user = await client.v2.getUserByUsername(username);
//     return user.data.id;
// }
//
// function delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }
//
// async function getFollowers(userId: string): Promise<v2.UserData[]> {
//     let followers: v2.UserData[] = [];
//     let paginationToken: string | undefined;
//
//     while (followers.length < 100000) {
//         // @ts-ignore
//         const result = await client.v2.getFollowing(userId, {
//             max_results: 1000,
//             pagination_token: paginationToken,
//         });
//
//         followers = followers.concat(result.data);
//
//         paginationToken = result.meta.next_token;
//
//         if (!paginationToken) break;
//
//         // Rate limit: 15 requests per 15-minute window, add delay
//         await delay(60000); // Delay for 60 seconds
//     }
//
//     return followers;
// }
//
// async function getFollowersByUsername(username: string): Promise<void> {
//     const userId = await getUserId(username);
//     const followers = await getFollowers(userId);
//
//     // Save follower list to a file
//     const fileName = `${username}_followers.json`;
//     await fsPromises.writeFile(fileName, JSON.stringify(followers, null, 2));
//     console.log(`Follower list downloaded and saved to ${fileName}`);
// }
//
// export default {
//     initialize: async function(): Promise<boolean> {
//
//         return true;
//     },
//     getFollowers: getFollowersByUsername
// }
