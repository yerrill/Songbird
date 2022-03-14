import { Client, CommandInteraction, Intents, Interaction } from 'discord.js';
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { discordToken, oauthClientId } from "./config.json";
import State, { Subs } from './State';


export default class Commands {
	client: Client;
	state: State;
	commands: SlashCommandBuilder[];

    constructor(client_: Client, s: State) {
		this.client = client_;
		this.state = s;
		this.commands = [];

		var c: SlashCommandBuilder;

		c = new SlashCommandBuilder()
		c.setName('register');
		c.setDescription('Register this channel for Tweets');
		this.commands.push(c);

		c = new SlashCommandBuilder();
		c.setName('deregister');
		c.setDescription('Deregister this channel for Tweets');
		this.commands.push(c);

		c = new SlashCommandBuilder();
		c.setName('start');
		c.setDescription('Start/Resume sending Tweets');
		this.commands.push(c);

		c = new SlashCommandBuilder();
		c.setName('stop');
		c.setDescription('Stop/Pause sending Tweets');
		this.commands.push(c);

		c = new SlashCommandBuilder();
		c.setName('add');
		c.setDescription('Add username to follow');
		c.addStringOption( (option) => {
			option.setName("user");
			option.setDescription("Username to follow");
			return option;
		});

		this.commands.push(c);

		c = new SlashCommandBuilder();
		c.setName('remove');
		c.setDescription('Remove username from following');
		c.addStringOption( (option) => {
			option.setName("user");
			option.setDescription("Username to unfollow");
			return option;
		});

		this.commands.push(c);
    }

	

	async register(guildId: string): Promise<boolean> {
		const sendCommands: any[] = this.commands.map(command => command.toJSON());

		const rest = new REST({ version: '9' }).setToken(discordToken);

		try{
			await rest.put(Routes.applicationGuildCommands(oauthClientId, guildId), { body: sendCommands })
			return true;
		} catch (e) {
			console.log(e);
		}
		return false;
	}

	async handler(interaction: CommandInteraction): Promise<void> {
		

		console.log(interaction.options.get("user")?.value);
	}
}
