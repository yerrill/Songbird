import {readFileSync, writeFileSync} from 'fs';
const stateSave = './state.json';


interface StateObj_ {
    twitterUsers: Pair[];
    subscriptions: Subs[];
}

export class StateObj implements StateObj_ {
    twitterUsers: Pair[];
    subscriptions: Subs[];

    constructor() {
        this.twitterUsers = [];
        this.subscriptions = [];
    }
}

interface Subs_ {
    channelId: string;
    sending: boolean;
    observed: string[];
}

export class Subs implements Subs_ {
    channelId: string;
    sending: boolean;
    observed: string[];
    
    constructor(c_id: string, send: boolean, obs: string[]) {
        this.channelId = c_id;
        this.sending = send;
        this.observed = obs;
    }
}

interface Pair_ {
    id: string;
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

        for (var n in json.twitterUsers) { // Parse twitter users and last tweet into pair
            this.obj.twitterUsers.push(new Pair(json.twitterUsers[n].id, json.twitterUsers[n].value));
        }

        var c_id: string;
        var sending: boolean;
        var subs: string[];

        for (var i in json.subscriptions) {
            c_id = json.subscriptions[i].channelId;
            sending = json.subscriptions[i].sending;
            subs = []

            for (var j in json.subscriptions.observed) {
                subs.push(json.subscriptions.observed[j])
            }

            this.obj.subscriptions.push(new Subs(c_id, sending, subs));
        }
    }

    write(): void {
        writeFileSync(stateSave, JSON.stringify(this.obj));
    }

    isRegistered(channel: string): boolean {
        for (var n in this.obj.subscriptions) {
            if (this.obj.subscriptions[n].channelId === channel) {
                return true;
            }
        }

        return false;
    }

    register(channel: string): void {
        if (this.isRegistered(channel)) { return; }
    }
}
