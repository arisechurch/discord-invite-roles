# discord-invite-roles

When someone is invited to a channel on your server, this bot will look in the
channel topic for `[[Name of Role, Another role name]]` annotations. It will
then automatically add those roles to the new member.

There are no commands for this bot, as it uses the channel topic for
configuration.

## Example

If you had a channel `#dogs` on your server, and if someone is invited to that
channel you wanted to give them the `Dog lover` and `Animal lover` roles, you
would add `[[Animal lover, Dog lover]]` to the channel topic.

## Requirements

- You will need to make sure the bot has the View Channels, Manage Roles and
  Manage Server permissions. It also asks for permission to create slash
  commands, as we plan to add some commands in the future.
- The bot role needs to be prioritized higher than any other roles you want to
  grant to new members.

## Development

1. Copy `.env-example` to `.env` and add your bot token
2. Run `yarn install`
3. Run `./node_modules/.bin/nodemon src/main.ts` to run the bot. It will
   automatically restart when changes are made.
