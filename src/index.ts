import { Client, CommandInteraction, Intents, Interaction } from 'discord.js';
import { discordToken } from './config.json';
import State from './State';
import Commands from './Commands';


const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const state = new State();
const commands = new Commands(client, state);


client.once('ready', async () => {
	console.log('Ready!');

	const guilds: string[] = client.guilds.cache.map((guild) => guild.id);
	console.log(guilds);

	var status: boolean;
	for (var n in guilds) {
		status = await commands.register(guilds[n]);

		if (!status) { console.log(`${guilds[n]} - Could Not Register Commands`); }
	}
});

client.on('interactionCreate', (i) => {
	if (!i.isApplicationCommand()) { return; }

	commands.handler(i as CommandInteraction);
});

client.login(discordToken);

client.on("SIGTERM", () => {
	console.log(state.obj);
	client.destroy();
});
