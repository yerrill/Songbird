import { MessageEmbed } from "discord.js";
import { TweetUserTimelineV2Paginator, TwitterApi, UserV2Result } from "twitter-api-v2";
import State, {Pair} from "./State";

export class Twitter {
    twitterClient: TwitterApi;
    bearerToken!: string;
    stateRep!: State;

    constructor(bearer: string, state_ref: State) {
        this.twitterClient = new TwitterApi(bearer);
        this.bearerToken = bearer;
        this.stateRep = state_ref;
    }

    async getIdByUsername(username: string): Promise<string> { // Change To accurate typing later
        const user: Promise<UserV2Result> = this.twitterClient.v2.userByUsername(username); // Promise, find user

        return new Promise((resolve, reject) => {
            user.then( (v) => {
                resolve(v.data.id);
            });
            user.catch( (e) => {
                reject(`getIdByUsername - Twitter Error: ${e}`);
            });
        });
    }

    async makeProfile(id: string): Promise<Profile> { // Create a profile used for further actions
        const info: Promise<UserV2Result> = this.twitterClient.v2.user(id, { "user.fields": ["profile_image_url"] });

        return new Promise((resolve, reject) => {
            info.then( (v) => {
                resolve(new Profile(v.data.id, v.data.name, v.data.username, v.data.profile_image_url));
            });
            info.catch( (e) => {
                reject(`makeProfile - Twitter Error ${e}`)
            });
        });
    }

    async getTweetsByProfile(profile: Profile): Promise<Tweet[]> {
        var lastTweet = this.stateGetLastTweetById(profile.id);
        var info: Promise<TweetUserTimelineV2Paginator>;

        if (lastTweet === "") {
            info = this.twitterClient.v2.userTimeline(profile.id, {exclude: ['replies', 'retweets']});
        }
        else {
            info = this.twitterClient.v2.userTimeline(profile.id, {exclude: ['replies', 'retweets'], since_id: lastTweet});
        }

        info.then( (v) => {
            if(v.meta.newest_id){
                this.stateUpdateLastTweet(profile.id, v.meta.newest_id);
            }
            //console.log(`Updated Last Tweet: ${profile.id} - ${v.meta.newest_id}`);
        });

        return new Promise((resolve, reject) => {
            var arr: Tweet[] = [];
            var t: Tweet;

            info.then( (v) => {
                for (var n in v.tweets) {
                    t = new Tweet(profile, v.tweets[n].id, v.tweets[n].text);
                    arr.push(t);
                }

                resolve(arr);
            });
            info.catch( (e) => {
                reject(`getTweetsByProfile - Twitter Error ${e}`);
            });
        });
    }

    stateGetLastTweetById(id: string): string { // State - Get last tweet id from state
        var tweetId: string;

        for (var n in this.stateRep.obj.twitterUsers){
            if (this.stateRep.obj.twitterUsers[n].id == id) {
                return this.stateRep.obj.twitterUsers[n].value;
            }
        }

        return "";
    }

    stateUpdateLastTweet(id: string, tweetId: string): void { //State - Update the last tweet from user
        for (var n in this.stateRep.obj.twitterUsers) {
            if (this.stateRep.obj.twitterUsers[n].id == id) {
                this.stateRep.obj.twitterUsers[n].value = tweetId;
            }
        }
    }

}

export class Profile { // Twitter user profile.
    profileId: string;
    profileName: string;
    profileUsername: string;
    profileImage?: string;
    profileURL: string;

    constructor(id: string, name: string, user: string, image?: string) {
        this.profileId = id;
        this.profileName = name;
        this.profileUsername = user;
        this.profileImage = image;
        this.profileURL = `https://twitter.com/${this.profileUsername}`
    }

    get id(): string {
        return this.profileId;
    }

    get name(): string {
        return this.profileName;
    }

    get username(): string {
        return this.profileUsername;
    }

    get url(): string | undefined{
        return this.profileURL;
    }

    get image(): string {
        return this.image;
    }
}

export class Tweet {
    tweetAuthor: Profile;
    tweetId: string;
    tweetText: string;
    tweetURL: string;

    constructor(author: Profile, id: string, text: string) {
        this.tweetAuthor = author;
        this.tweetId = id;
        this.tweetText = text;
        this.tweetURL = `https://twitter.com/${this.tweetAuthor.username}/status/${this.tweetId}`;
    }

    get author(): Profile {
        return this.tweetAuthor;
    }

    get id(): string {
        return this.tweetId;
    }

    get text(): string {
        return this.tweetText;
    }

    get url(): string {
        return this.tweetURL;
    }
}

export class TwitterEmbed extends MessageEmbed {
    public constructor(tweet: Tweet){
        super();
        this.setColor("#1DA1F2");

        this.setTitle(`${tweet.author.name}:`);
        this.setURL(tweet.url);
        this.setDescription(tweet.text);

        this.setAuthor({ name: tweet.author.username, iconURL: tweet.author.profileImage, url: tweet.author.url });
        //this.setThumbnail("https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg");
    }
}