"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get client and context
            const client = github.getOctokit(core.getInput('repo-token', { required: true }));
            const context = github.context;
            // Do nothing if its not their first contribution
            console.log('Checking if its the users first contribution');
            if (!context.payload.sender) {
                throw new Error('Internal error, no sender provided by GitHub');
            }
            const sender = context.payload.sender.login;
            const issue = context.issue;
            let firstContribution = false;
            firstContribution = yield isFirstIssue(client, issue.owner, issue.repo, sender, issue.number);
            const time = new Date().toUTCString();
            const message = `${sender} forked this repo. The countdown starts at ${time}`;
            // Add a comment to the appropriate place
            console.log(`Adding message: ${message} to ${issue.number}`);
            yield client.rest.issues.create({
                title: `${sender}: fork`,
                owner: issue.owner,
                repo: issue.repo,
                body: message,
                labels: [
                    {
                        name: 'jobstarts',
                        description: 'This repo has been forked. Sets by bot.'
                    }
                ]
            });
        }
        catch (error) {
            core.setFailed(error.message);
            return;
        }
    });
}
function isFirstIssue(client, owner, repo, sender, curIssueNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const { status, data: issues } = yield client.rest.issues.listForRepo({
            owner: owner,
            repo: repo,
            creator: sender,
            state: 'all'
        });
        if (status !== 200) {
            throw new Error(`Received unexpected API status code ${status}`);
        }
        if (issues.length === 0) {
            return true;
        }
        for (const issue of issues) {
            if (issue.number < curIssueNumber && !issue.pull_request) {
                return false;
            }
        }
        return true;
    });
}
run();
