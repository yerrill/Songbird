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

    
    async getInfo(id: string): Promise<Profile> { // Create a profile used for further actions, Promise<Profile>
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

    /*
    async getTweetsByProfile(profile: Profile, lastTweet?: string): Promise<Tweet[]> {
        //var lastTweet = this.stateGetLastTweetById(profile.id);
        var info: Promise<TweetUserTimelineV2Paginator>;

        if (!lastTweet) {
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
    }*/

    async getTweets(userId: string, lastTweet: string): Promise<TweetSet> {
        //const profile: Profile = await this.makeProfile(userId);

        var info: Promise<TweetUserTimelineV2Paginator>;

        if (lastTweet === "") {
            info = this.twitterClient.v2.userTimeline(userId, {exclude: ['replies', 'retweets']});
        }
        else {
            info = this.twitterClient.v2.userTimeline(userId, {exclude: ['replies', 'retweets'], since_id: lastTweet});
        }
        
        return new Promise((resolve, reject) => {
            var arr: Tweet[] = [];
            var t: Tweet;

            info.then( (v) => {
                for (var n in v.tweets) {
                    t = new Tweet(userId, v.tweets[n].id, v.tweets[n].text);
                    arr.push(t);
                }

                resolve(new TweetSet(arr, v.meta.newest_id));
            });
            info.catch( (e) => {
                reject(`getTweets - Twitter Error ${e}`);
            });
        });
    }

    async createEmbed(tweet: Tweet): Promise<TwitterEmbed> {
        const info: Profile = await this.getInfo(tweet.authorId);

        return new TwitterEmbed(tweet, info);
    }
}


export class Profile { // Twitter user profile.
    id: string;
    name: string;
    uname: string;
    image?: string;
    url: string;

    constructor(id: string, name: string, user: string, image?: string) {
        this.id = id;
        this.name = name;
        this.uname = user;
        this.image = image;
        this.url = `https://twitter.com/${this.uname}`
    }
}


export class Tweet {
    authorId: string;
    id: string;
    text: string;

    constructor(authorId: string, id_: string, text_: string) {
        this.authorId = authorId;
        this.id = id_;
        this.text = text_;
        //this.tweetURL = `https://twitter.com/${this.tweetAuthor.username}/status/${this.tweetId}`;
    }
}


export class TweetSet {
    tweets: Tweet[];
    latestId: string;

    constructor(t: Tweet[], lid: string) {
        this.tweets = t;
        this.latestId = lid;
    }
}


export class TwitterEmbed extends MessageEmbed {
    public constructor(tweet: Tweet, userInfo: Profile){
        super();
        this.setColor("#1DA1F2");

        this.setTitle(`${userInfo.name}:`);
        this.setURL(`https://twitter.com/${userInfo.uname}/status/${tweet.id}`);
        this.setDescription(tweet.text);

        //this.profileURL = `https://twitter.com/${this.profileUsername}`

        this.setAuthor({ name: userInfo.uname, iconURL: userInfo.image, url: userInfo.url });
        //this.setThumbnail("https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg");
    }
}