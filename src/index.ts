import { Client, CommandInteraction, Intents, Interaction, Message, MessageEmbed, TextChannel } from 'discord.js';
import { discordToken, twitterBearer } from './config.json';
import State from './State';
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

	var channel: string;

	var tweets: TweetSet;

	var embed: MessageEmbed;

	for (var i in state.obj.accounts) {
		channel = state.obj.accounts[i].channel;

		for (var j in state.obj.accounts[i].users) {
			tweets = await twitter.getTweets(state.obj.accounts[i].users[j].id, state.obj.accounts[i].users[j].value);

			state.obj.accounts[i].users[j].value = tweets.latestId;

			for (var k in tweets.tweets) {
				embed = await twitter.createEmbed(tweets.tweets[k])
				sendEmbed(channel, embed);
			}
		}
	}
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
	console.log(state.obj);
	state.write();
	job.stop();
	client.destroy();
});
