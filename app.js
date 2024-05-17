const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const ballotObject = {
  question: "",
  numOfAnswers: 0,
  answers: [],
  completionDate: "",
  team: "",
  mandatory: "",
};

app.message("hello", async ({ message, say }) => {
  await say({
    blocks: [
      {
        dispatch_action: true,
        type: "input",
        element: {
          type: "plain_text_input",
          action_id: "question_log",
        },
        label: {
          type: "plain_text",
          text: "Question",
          emoji: true,
        },
      },
    ],
    text: "fallback",
  });
});

app.action("question_log", async ({ body, ack, say }) => {
  await ack();

  const blockId = body.message.blocks[0]["block_id"];
  const _question = body.state.values[`${blockId}`]["question_log"].value;
  ballotObject.question = _question;
  await say({
    blocks: [
      {
        dispatch_action: true,
        type: "input",
        element: {
          type: "plain_text_input",
          action_id: "num_of_responses_log",
        },
        label: {
          type: "plain_text",
          text: "Number of Responses",
          emoji: true,
        },
      },
    ],
    text: "fallback",
  });
});

app.action("num_of_responses_log", async ({ body, ack, say }) => {
  await ack();

  const blockId = body.message.blocks[0]["block_id"];
  const _numOfResponses = Number(
    body.state.values[`${blockId}`]["num_of_responses_log"].value
  );

  if (_numOfResponses === NaN) {
    await say({ text: "Please enter a number" });
  }
});

const main = async () => {
  await app.start(process.env.PORT || 3000);
  console.log("app is running");
};

main();
