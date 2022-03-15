import {readFileSync, writeFileSync} from 'fs';
const stateSave = './state.json';


interface StateObj_ {
    accounts: Account[];
}

export class StateObj implements StateObj_ {
    accounts: Account[];

    constructor() {
        this.accounts = [];
    }
}

interface Account_ {
    channel: string;
    sending: boolean;
    users: Pair[];
}

export class Account implements Account_ {
    channel: string; // Primary Key
    sending: boolean;
    users: Pair[];

    constructor(channel_: string, sending_: boolean, users_: Pair[]) {
        this.channel = channel_;
        this.sending = sending_;
        this.users = users_;
    }
}

interface Pair_ {
    id: string; // Primary Key
    value: string;
}

export class Pair implements Pair_ {
    id: string;
    value: string;

    constructor(in_id: string, in_value: string) {
        this.id = in_id;
        this.value = in_value;
    }

}


export default class State{
    obj: StateObj;

    constructor() {
        var json: any = JSON.parse(readFileSync(stateSave, 'utf8'));

        this.obj = new StateObj();

        var channel: string;
        var sending: boolean;
        var users: Pair[];

        var uid: string;
        var tweet: string;

        for (var i in json.accounts) {
            channel = json.accounts[i].channel;
            sending = json.accounts[i].sending;
            users = [];

            for (var j in json.accounts[i].users) {
                uid = json.accounts[i].users[j].id;
                tweet = json.accounts[i].users[j].value;
                users.push(new Pair(uid, tweet));
            }

            this.obj.accounts.push(new Account(channel, sending, users));
        }
    }

    write(): void {
        writeFileSync(stateSave, JSON.stringify(this.obj));
    }

    // ACCOUNT LEVEL

    /**
     * Return Account object reference
     * @param key Channel ID
     * @returns Existing account reference or undefined
     */
    getAccount(key: string): Account | undefined {
        var r: Account;

        for (var n in this.obj.accounts) {
            if (this.obj.accounts[n].channel === key) {
                r = this.obj.accounts[n];
                return r;
            }
        }

        return undefined;
    }

    /**
     * Add an Account to the state
     * @param key Channel ID
     * @returns New Account referece
     */
    createAccount(key: string): Account {
        var r: Account | undefined;

        r = this.getAccount(key);

        if (!r) {
            r = new Account(key, true, []);
            this.obj.accounts.push(r);
        }

        return r;
    }

    /**
     * Remove Account from state
     * @param key Channel ID
     * @returns void
     */
    removeAccount(key: string): void {
        if (!this.getAccount(key)) { return; }

        this.obj.accounts = this.obj.accounts.filter( (value, index, arr) => value.channel !== key);
    }

    // USER LEVEL

    getUser(account: Account, key: string): Pair | undefined {
        var u: Pair;

        for (var n in account.users) {
            if (account.users[n].id === key) {
                u = account.users[n];
                return u;
            }
        }

        return undefined;
    }

    addUser(account: Account, key: string): Pair {
        var u: Pair | undefined;

        u = this.getUser(account, key);

        if (!u) {
            u = new Pair(key, "");
            account.users.push(u);
        }

        return u;
    }

    removeUser(account: Account, key: string): void {
        if (!this.getUser(account, key)) { return; }

        account.users = account.users.filter( (value, index, arr) => value.id !== key);
    }

    // TWEET LEVEL

    updateTweet(user: Pair, key: string): void {
        user.value = key;
    }
}
