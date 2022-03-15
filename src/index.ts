import { Client, CommandInteraction, Intents, Interaction, Message, MessageEmbed, TextChannel } from 'discord.js';
import { discordToken, twitterBearer } from './config.json';
import State, { Account, Pair } from './State';
import Commands from './Commands';
import { Profile, TweetSet, Twitter } from './Twitter';
import { CronJob } from 'cron';

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const state = new State();
const twitter = new Twitter(twitterBearer, state);
const commands = new Commands(client, state, twitter);


async function sendEmbed(channelID: string, embed: MessageEmbed): Promise<Message<boolean>> {
    const channel = client.channels.cache.get(channelID) as TextChannel;
    return channel.send({ embeds: [embed] });
}

var job = new CronJob("*/2 * * * *", async () => {
	console.log("Firing Job");

	var accounts: Account[] = state.obj.accounts;
	var acc: Account;
	var user: Pair;

	var tweets: TweetSet;

	var embed: MessageEmbed;

	for (var i in accounts) {
		acc = state.getAccount(accounts[i].channel) as Account;

		for (var j in acc.users) {
			user = state.getUser(acc, acc.users[j].id) as Pair;

			tweets = await twitter.getTweets(user.id, user.value);

			if(tweets.latestId){
				state.updateTweet(user, tweets.latestId);
				//console.log("Updated Values");
			}
			
			//console.log(tweets);

			for (var k in tweets.tweets) {
				embed = await twitter.createEmbed(tweets.tweets[k])
				//console.log(tweets.tweets[k]);
				sendEmbed(acc.channel, embed);
			}
		}

		//console.log(state.obj.accounts[0].users);
	}
	state.write();
});


client.once('ready', async () => {
	console.log('Ready!');

	const guilds: string[] = client.guilds.cache.map((guild) => guild.id);
	console.log(guilds);

	var status: boolean;
	for (var n in guilds) {
		status = await commands.register(guilds[n]);

		if (!status) { console.log(`${guilds[n]} - Could Not Register Commands`); }
	}

	job.start();
});

client.on('interactionCreate', (i) => {
	if (!i.isApplicationCommand()) { return; }

	commands.handler(i as CommandInteraction);
});

client.login(discordToken);


process.on("SIGINT", () => {
	//console.log(state.obj);
	state.write();
	job.stop();
	client.destroy();
});
