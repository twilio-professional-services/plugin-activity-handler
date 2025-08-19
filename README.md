# Notice - Legacy Code

**This plugin is no longer maintained and has been migrated to the [Flex Plugin Library](https://www.twilio.com/docs/flex/developer/plugins/plugin-library) where it is available as an out-of-box feature. The plugin is also available as part of the customizable [Flex Project Template](https://github.com/twilio-professional-services/flex-project-template), where it is an optional feature.**

# Flex Activity Handler Plugin

>Twilio Flex Plugins allow you to customize the appearance and behavior of [Twilio Flex](https://www.twilio.com/flex). If you want to learn more about the capabilities and how to use the API, check out our [Flex documentation](https://www.twilio.com/docs/flex).

# Overview

This plugin addresses a few common needs in many contact centers:

* Changing the worker's activity when they're handling tasks and when their tasks are in wrapup.
  * This makes it easier to monitor what workers are doing in realtime, and improves workforce management visibility in Flex Insights for historical reporting
* Ability to define activities that should not be manually selected, such as the activities used to indicate the worker is handling tasks or in wrapup
* Preventing the worker from changing their activity while they're on a task, delaying that activity change until after they've completed their tasks
  * Changing to another activity like "Break" while the agent is actively handling tasks can result in inaccurate activity based reporting. Preventing that change until they're actually complete with their tasks aids in reporting and monitoring accuracy.

# Demos

This section provides visual examples of what to expect for each feature above.

### "On a Task" and "Wrap Up" Activity Change (Inbound Queue Call)

!["On a Task" and "Wrap Up" Activity Change, Inbound Queue Call](readme_images/plugin-activity-handler-inbound-acd.gif)

### "On a Task, No ACD" and "Wrap Up, No ACD" Activity Change (Outbound Call from non-Available Activity)

!["On a Task, No ACD" and "Wrap Up, No ACD" Activity Change, Outbound Call from non-Available Activity](readme_images/plugin-activity-handler-outbound-no-acd.gif)

### Preventing Selection of Restricted Activities

![Preventing Selection of Restricted Activities](readme_images/plugin-activity-handler-restricted-activities.gif)

### Delaying Activity Change Until Tasks Are Completed

![Delaying Activity Change Until Tasks Are Completed](readme_images/plugin-activity-handler-delayed-activity-change.gif)

# Configuration

## TaskRouter Activities

This plugin is built to support the following activities for tracking if an agent has an assigned task:

* **On a Task** (`Available: true`)
  * This is an Available activity and is used after accepting an inbound task from the queue, or when an outbound call is placed while in an Available activity
  * Indicates the worker has at least one assigned task not in a `wrapping` state
* **Wrap Up** (`Available: true`)
  * This is an Available activity and is used when all assigned tasks are in a `wrapping` state
  * In the case of an outbound call task in `wrapping` state, this is used if the outbound call was placed while in an Available activity
* **On a Task, No ACD** (`Available: false`)
  * This is a non-Available activity and is used when an outbound call is placed while in a non-Available activity
  * Using a non-Available activity in this scenario ensures the worker doesn't receive any unexpected tasks from the queue when their activity is automatically changed
* **Wrap Up, No ACD** (`Available: false`)
  * This is a non-Available activity and is used when an outbound call that was placed while in a non-Available activity enters the `wrapping` state and the worker has no other non-wrapping assigned tasks
  * Using a non-Available activity in this scenario ensures the worker doesn't receive any unexpected tasks from the queue when their activity is automatically changed

If these activity names suit your requirements, you simply need to add them to your TaskRouter configuration in the Twilio Console -> TaskRouter -> [Workspace] -> Activities. Please pay attention to the `Available` boolean following each activity name above and use that same boolean value when creating the activity in the Twilio Console.

If you'd prefer to use different names for these activities, after creating the desired activities in the Twilio Console, you will need to change the activity string names referenced in the plugin [`src/enums/index.js`](src/enums/index.js) module, `Activity` object:

```
export const Activity = {
  available: 'Available',
  onATask: 'On a Task',
  onATaskNoAcd: 'On a Task, No ACD',
  wrapup: 'Wrap Up',
  wrapupNoAcd: 'Wrap Up, No ACD'
};
```

For example, if you wanted to use "On a Call" to indicate when the worker was on a task and "After Call Work" to indicate a worker's assigned tasks are in `wrapping`, and carry those same base values to the non-Available variants, your modified `Activity` object would look like:

```
export const Activity = {
  available: 'Available',
  onATask: 'On a Call',
  onATaskNoAcd: 'On a Call, No ACD',
  wrapup: 'After Call Work',
  wrapupNoAcd: 'After Call Work, No ACD'
};
```

If you are using your own activity names, please ensure the `Available` boolean values in the activity list at the start of this section are maintained. For example, "After Call Work" would still be `Available: true`, while "After Call Work, No ACD" would still be `Available: false`.

## Flex Plugin

This repository is a Flex plugin with some other assets. The following describes how you setup, develop and deploy your Flex plugin.

### Requirements

This plugin uses the Twilio CLI for deployment and development.

- Install or update the Twilio CLI to the latest version
  - Instructions: https://www.twilio.com/docs/twilio-cli/quickstart#install-twilio-cli
- Install or update the Flex CLI Plugin to the latest version

  - Instructions: https://www.twilio.com/docs/flex/developer/plugins/cli/install

- Install the Twilio Serverless plugin.
  - Instructions: https://www.twilio.com/docs/twilio-cli/plugins#available-plugins

### Setup

Make sure you have [Node.js](https://nodejs.org) as well as [`npm`](https://npmjs.com) installed.

Afterwards, install the dependencies by running `npm install`:

```bash
cd

# If you use npm
npm install
```

In the `/public` directory make a copy of the `appConfig.examples.js` file and rename it to `appConfig.js`, copy the contents from `appConfig.examples.js` and paste it into `appConfig.js`.

---

### Development

In order to develop locally, you can use the Twilio CLI to run the plugin locally. Using your commandline run the following from the root dirctory of the plugin.

```bash
twilio flex:plugins:start
```

This will automatically start up the Webpack Dev Server and open the browser for you. Your app will run on `http://localhost:3000`.

When you make changes to your code, the browser window will be automatically refreshed.

---

### Deploy

#### Plugin Deployment

Once you are happy with your plugin, you have to deploy then release the plugin for it to take affecte on Twilio hosted Flex.

Run the following command to start the deployment:

```bash
twilio flex:plugins:deploy --major --changelog "Notes for this version" --description "Functionality of the plugin"
```

After your deployment runs you will receive instructions for releasing your plugin from the bash prompt. You can use this or skip this step and release your plugin from the Flex plugin dashboard here https://flex.twilio.com/admin/plugins

For more details on deploying your plugin, refer to the [deploying your plugin guide](https://www.twilio.com/docs/flex/plugins#deploying-your-plugin).

Note: Common packages like `React`, `ReactDOM`, `Redux` and `ReactRedux` are not bundled with the build because they are treated as external dependencies so the plugin will depend on Flex to provide them globally.
